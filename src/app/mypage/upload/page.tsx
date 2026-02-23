"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import { onAuthStateChanged, User } from "firebase/auth";
import { collection, query, where, getDocs, doc, setDoc, Timestamp } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import { auth, db, storage } from "@/lib/firebase";
import AuthGuard from "@/components/AuthGuard";
import Header from "@/components/Header";

export default function UploadPage() {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [companyId, setCompanyId] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number>(0);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);
  const [title, setTitle] = useState("");
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => {
    if (!auth || !db) return;

    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        await loadCompanyData(currentUser.uid);
      }
    });

    return () => unsubscribe();
  }, []);

  const loadCompanyData = async (uid: string) => {
    if (!db) return;

    try {
      const companiesRef = collection(db, "companies");
      const companyQuery = query(companiesRef, where("userId", "==", uid));
      const companySnapshot = await getDocs(companyQuery);

      if (!companySnapshot.empty) {
        const companyDoc = companySnapshot.docs[0];
        setCompanyId(companyDoc.id);
      } else {
        setMessage({ type: "error", text: "企業情報を先に登録してください" });
      }
    } catch (error) {
      console.error("Error loading company data:", error);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      
      // PDFファイルのみ許可
      if (selectedFile.type !== "application/pdf") {
        setMessage({ type: "error", text: "PDFファイルのみアップロード可能です" });
        return;
      }

      // ファイルサイズチェック（10MB制限）
      if (selectedFile.size > 10 * 1024 * 1024) {
        setMessage({ type: "error", text: "ファイルサイズは10MB以下にしてください" });
        return;
      }

      setFile(selectedFile);
      setMessage(null);
    }
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setMessage(null);

    if (!db || !storage || !user || !companyId) {
      setMessage({ type: "error", text: "認証エラーまたは企業情報が未登録です" });
      return;
    }

    if (!title || !file) {
      setMessage({ type: "error", text: "タイトルとファイルを入力してください" });
      return;
    }

    setLoading(true);
    setUploadProgress(0);

    try {
      // ユニークなファイル名を生成
      const timestamp = Date.now();
      const fileName = `${timestamp}_${file.name}`;
      const storagePath = `notices/${user.uid}/${companyId}/${fileName}`;
      
      console.log("Uploading to:", storagePath);

      // Firebase Storageにアップロード
      const storageRef = ref(storage, storagePath);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          // アップロード進捗
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          setUploadProgress(progress);
          console.log("Upload progress:", progress);
        },
        (error) => {
          // エラー処理
          console.error("Upload error:", error);
          setMessage({ type: "error", text: "アップロードに失敗しました: " + error.message });
          setLoading(false);
        },
        async () => {
          // アップロード完了
          try {
            const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
            console.log("File uploaded, URL:", downloadURL);

            // Firestoreにメタ情報を保存
            if (!db) {
              throw new Error("Firestore is not initialized");
            }
            
            const noticeRef = doc(collection(db, "companies", companyId, "notices"));
            const noticeData = {
              uuid: noticeRef.id,
              userId: user.uid,
              title: title,
              pdfUrl: downloadURL,
              pdfPath: storagePath,
              createdAt: Timestamp.now(),
              updatedAt: Timestamp.now(),
            };

            await setDoc(noticeRef, noticeData);
            console.log("Notice metadata saved");

            setMessage({ type: "success", text: "アップロードが完了しました。マイページに戻ります..." });
            
            // 2秒後にマイページへ遷移
            setTimeout(() => {
              router.push("/mypage");
            }, 2000);
          } catch (error: any) {
            console.error("Error saving metadata:", error);
            setMessage({ type: "error", text: "メタデータの保存に失敗しました: " + error.message });
            setLoading(false);
          }
        }
      );
    } catch (error: any) {
      console.error("Error uploading file:", error);
      setMessage({ type: "error", text: "アップロードに失敗しました: " + error.message });
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gray-50">
        <Header />
        <main className="container mx-auto px-4 py-16">
          <div className="max-w-2xl mx-auto">
            <div className="mb-6">
              <button
                onClick={() => router.push("/mypage")}
                className="text-blue-600 hover:text-blue-800 flex items-center gap-2"
              >
                ← マイページに戻る
              </button>
            </div>

            <h1 className="text-3xl font-bold mb-8">決算公告のアップロード</h1>

            {!companyId && (
              <div className="bg-yellow-100 border border-yellow-400 text-yellow-700 p-4 rounded mb-6">
                企業情報を先に登録してください。
                <button
                  onClick={() => router.push("/mypage/edit")}
                  className="ml-2 text-blue-600 hover:text-blue-800 underline"
                >
                  企業情報を登録
                </button>
              </div>
            )}

            <div className="bg-white p-8 rounded-lg shadow">
              {message && (
                <div className={`mb-6 p-4 rounded ${
                  message.type === "success"
                    ? "bg-green-100 border border-green-400 text-green-700"
                    : "bg-red-100 border border-red-400 text-red-700"
                }`}>
                  {message.text}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="title" className="block text-sm font-medium mb-2">
                    タイトル <span className="text-red-500">必須</span>
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="例: 第1期決算公告"
                    required
                    disabled={loading || !companyId}
                  />
                </div>

                <div>
                  <label htmlFor="file" className="block text-sm font-medium mb-2">
                    PDFファイル <span className="text-red-500">必須</span>
                  </label>
                  <input
                    type="file"
                    id="file"
                    accept="application/pdf"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={loading || !companyId}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    PDFファイルのみ。最大10MB
                  </p>
                  {file && (
                    <p className="text-sm text-gray-700 mt-2">
                      選択中: {file.name} ({(file.size / 1024 / 1024).toFixed(2)} MB)
                    </p>
                  )}
                </div>

                {loading && uploadProgress > 0 && (
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-4">
                      <div
                        className="bg-blue-600 h-4 rounded-full transition-all duration-300"
                        style={{ width: `${uploadProgress}%` }}
                      ></div>
                    </div>
                    <p className="text-sm text-gray-600 text-center">
                      アップロード中... {Math.round(uploadProgress)}%
                    </p>
                  </div>
                )}

                <div className="flex gap-4 pt-4">
                  <button
                    type="button"
                    onClick={() => router.push("/mypage")}
                    disabled={loading}
                    className="flex-1 bg-gray-300 text-gray-700 py-3 rounded-md hover:bg-gray-400 disabled:bg-gray-200 transition-colors font-medium"
                  >
                    キャンセル
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !companyId || !file}
                    className="flex-1 bg-green-600 text-white py-3 rounded-md hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
                  >
                    {loading ? "アップロード中..." : "アップロード"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </main>
      </div>
    </AuthGuard>
  );
}
