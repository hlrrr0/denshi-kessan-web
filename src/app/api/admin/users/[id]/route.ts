import { NextRequest, NextResponse } from "next/server";
import { getFirebaseAdmin } from "@/lib/firebase-admin";
import { verifyAdmin } from "@/lib/admin-auth";
import admin from "firebase-admin";

// ユーザー詳細取得
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdmin(request);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json({ error: "Firebase is not configured" }, { status: 500 });
    }

    const { id: uid } = await params;
    const userDoc = await db.collection("users").doc(uid).get();

    if (!userDoc.exists) {
      return NextResponse.json({ error: "ユーザーが見つかりません" }, { status: 404 });
    }

    const userData = userDoc.data()!;

    // 企業情報を取得
    const companiesSnap = await db
      .collection("users")
      .doc(uid)
      .collection("company_information")
      .get();

    const companies = companiesSnap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        name: data.name || "",
        nameFurigana: data.nameFurigana || "",
        representativeName: data.representativeName || "",
        capital: data.capital || "",
        officeAddress: data.officeAddress || "",
        accountClosingMonth: data.accountClosingMonth || "",
        subscriptionActive: data.subscriptionActive || false,
        subscriptionExpiresAt: data.subscriptionExpiresAt?.toDate?.()?.toISOString() || null,
      };
    });

    // サブスクリプション情報を取得
    const subDoc = await db
      .collection("users")
      .doc(uid)
      .collection("subscription")
      .doc("current")
      .get();

    let subscription = null;
    if (subDoc.exists) {
      const subData = subDoc.data()!;
      subscription = {
        planId: subData.subscriptionPlanId || "",
        active: subData.active || false,
        expirationDate: subData.expirationDate?.toDate?.()?.toISOString() || null,
        automaticRenewal: subData.automaticRenewalFlag || false,
        payjpId: subData.payjpId || "",
        payjpType: subData.payjpType || "",
        amount: subData.amount || null,
      };
    }

    // 決算公告数を取得
    let totalNotices = 0;
    for (const companyDoc of companiesSnap.docs) {
      const noticesSnap = await db
        .collection("users")
        .doc(uid)
        .collection("company_information")
        .doc(companyDoc.id)
        .collection("notices")
        .get();
      totalNotices += noticesSnap.size;
    }

    return NextResponse.json({
      uid,
      email: userData.email || "",
      name: userData.name || "",
      phone: userData.phone || "",
      active: userData.active !== false,
      payjpCustomerId: userData.payjpCustomerId || "",
      payjpCardId: userData.payjpCardId || "",
      role: userData.role || "",
      legacyUuid: userData.legacyUuid || "",
      createdAt: userData.createdAt?.toDate?.()?.toISOString() || null,
      updatedAt: userData.updatedAt?.toDate?.()?.toISOString() || null,
      companies,
      subscription,
      totalNotices,
    });
  } catch (error: any) {
    console.error("Admin user detail error:", error);
    return NextResponse.json(
      { error: "ユーザー情報の取得に失敗しました", details: error.message },
      { status: 500 }
    );
  }
}

// ユーザー情報更新
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdmin(request);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json({ error: "Firebase is not configured" }, { status: 500 });
    }

    const { id: uid } = await params;
    const body = await request.json();
    const { name, phone, email, active } = body;

    const updateData: any = {
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (email !== undefined) updateData.email = email;
    if (active !== undefined) updateData.active = active;

    await db.collection("users").doc(uid).update(updateData);

    return NextResponse.json({ success: true, message: "ユーザー情報を更新しました" });
  } catch (error: any) {
    console.error("Admin user update error:", error);
    return NextResponse.json(
      { error: "ユーザー情報の更新に失敗しました", details: error.message },
      { status: 500 }
    );
  }
}

// ユーザー退会処理（論理削除）
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await verifyAdmin(request);
    if ("error" in authResult) {
      return NextResponse.json({ error: authResult.error }, { status: authResult.status });
    }

    const db = getFirebaseAdmin();
    if (!db) {
      return NextResponse.json({ error: "Firebase is not configured" }, { status: 500 });
    }

    const { id: uid } = await params;

    // ユーザーを論理削除（active = false）
    await db.collection("users").doc(uid).update({
      active: false,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    // サブスクリプションも無効化
    const subDoc = await db
      .collection("users")
      .doc(uid)
      .collection("subscription")
      .doc("current")
      .get();

    if (subDoc.exists) {
      await db
        .collection("users")
        .doc(uid)
        .collection("subscription")
        .doc("current")
        .update({
          active: false,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
    }

    // 企業情報のsubscriptionActiveも無効化
    const companiesSnap = await db
      .collection("users")
      .doc(uid)
      .collection("company_information")
      .get();

    for (const companyDoc of companiesSnap.docs) {
      await companyDoc.ref.update({
        subscriptionActive: false,
      });
    }

    // Pay.jp のサブスクリプションもキャンセル試行
    if (subDoc.exists) {
      const subData = subDoc.data()!;
      if (subData.payjpId && subData.payjpType === "subscription") {
        try {
          const payjpSecretKey = process.env.PAYJP_SECRET_KEY;
          if (payjpSecretKey) {
            const res = await fetch(
              `https://api.pay.jp/v1/subscriptions/${subData.payjpId}`,
              {
                method: "DELETE",
                headers: {
                  Authorization: `Basic ${Buffer.from(payjpSecretKey + ":").toString("base64")}`,
                },
              }
            );
            if (res.ok) {
              console.log(`Pay.jp subscription ${subData.payjpId} cancelled`);
            } else {
              console.warn(`Pay.jp subscription cancel failed: ${res.status}`);
            }
          }
        } catch (e) {
          console.warn("Pay.jp subscription cancel error:", e);
        }
      }
    }

    return NextResponse.json({ success: true, message: "退会処理が完了しました" });
  } catch (error: any) {
    console.error("Admin user delete error:", error);
    return NextResponse.json(
      { error: "退会処理に失敗しました", details: error.message },
      { status: 500 }
    );
  }
}
