import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  User
} from "firebase/auth";
import { doc, setDoc, getDoc, Timestamp } from "firebase/firestore";
import { auth, db } from "./firebase";

// ユーザープロフィール型
export interface UserProfile {
  uid: string;
  email: string;
  name: string;
  phone: string;
  active: boolean;
  payjpCustomerId?: string;
  payjpCardId?: string;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

// 会員登録
export async function signUp(
  email: string, 
  password: string, 
  name: string, 
  phone: string
): Promise<{ user: User; error: null } | { user: null; error: string }> {
  if (!auth || !db) {
    return { user: null, error: "Firebase の初期化に失敗しました" };
  }

  try {
    // Firebase Authentication でユーザー作成
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Firestore にユーザープロフィールを保存
    const userProfile: UserProfile = {
      uid: user.uid,
      email: user.email || email,
      name,
      phone,
      active: true,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    };

    await setDoc(doc(db, "users", user.uid), userProfile);

    return { user, error: null };
  } catch (error: any) {
    let errorMessage = "登録に失敗しました";
    
    if (error.code === "auth/email-already-in-use") {
      errorMessage = "このメールアドレスは既に使用されています";
    } else if (error.code === "auth/weak-password") {
      errorMessage = "パスワードは6文字以上で設定してください";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "メールアドレスの形式が正しくありません";
    }

    console.error("Sign up error:", error);
    return { user: null, error: errorMessage };
  }
}

// ログイン
export async function signIn(
  email: string, 
  password: string
): Promise<{ user: User; error: null } | { user: null; error: string }> {
  if (!auth) {
    return { user: null, error: "Firebase の初期化に失敗しました" };
  }

  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    return { user: userCredential.user, error: null };
  } catch (error: any) {
    let errorMessage = "ログインに失敗しました";

    if (error.code === "auth/user-not-found" || error.code === "auth/wrong-password" || error.code === "auth/invalid-credential") {
      errorMessage = "メールアドレスまたはパスワードが正しくありません";
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "メールアドレスの形式が正しくありません";
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "ログイン試行回数が多すぎます。しばらく待ってから再試行してください";
    }

    console.error("Sign in error:", error);
    return { user: null, error: errorMessage };
  }
}

// パスワードリセット
export async function resetPassword(
  email: string
): Promise<{ error: null } | { error: string }> {
  if (!auth) {
    return { error: "Firebase の初期化に失敗しました" };
  }

  try {
    const actionCodeSettings = {
      url: typeof window !== "undefined" 
        ? `${window.location.origin}/login` 
        : "https://denshi-kessan-web.vercel.app/login",
      handleCodeInApp: false,
    };
    await sendPasswordResetEmail(auth, email, actionCodeSettings);
    return { error: null };
  } catch (error: any) {
    let errorMessage = "パスワードリセットメールの送信に失敗しました";

    if (error.code === "auth/user-not-found") {
      // セキュリティ上、ユーザーが存在しない場合も成功扱いにする
      return { error: null };
    } else if (error.code === "auth/invalid-email") {
      errorMessage = "メールアドレスの形式が正しくありません";
    } else if (error.code === "auth/too-many-requests") {
      errorMessage = "送信回数が多すぎます。しばらく待ってから再試行してください";
    }

    return { error: errorMessage };
  }
}

// ログアウト
export async function signOut(): Promise<{ error: null } | { error: string }> {
  if (!auth) {
    return { error: "Firebase の初期化に失敗しました" };
  }

  try {
    await firebaseSignOut(auth);
    return { error: null };
  } catch (error: any) {
    console.error("Sign out error:", error);
    return { error: "ログアウトに失敗しました" };
  }
}

// ユーザープロフィールを取得
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db) {
    return null;
  }

  try {
    const docRef = doc(db, "users", uid);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return docSnap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    console.error("Get user profile error:", error);
    return null;
  }
}
