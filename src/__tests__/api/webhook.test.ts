// Webhook route のユニットテスト
// Firebase Admin と Pay.jp をモック化してテスト

// モック設定
const mockGet = jest.fn();
const mockUpdate = jest.fn();
const mockBatch = jest.fn().mockReturnValue({
  update: jest.fn(),
  commit: jest.fn(),
});
const mockCollectionGroup = jest.fn().mockReturnValue({
  where: jest.fn().mockReturnValue({
    limit: jest.fn().mockReturnValue({
      get: mockGet,
    }),
  }),
});
const mockCollection = jest.fn().mockReturnValue({
  where: jest.fn().mockReturnValue({
    get: jest.fn().mockResolvedValue({ empty: true, docs: [] }),
  }),
});

jest.mock("@/lib/firebase-admin", () => ({
  getFirebaseAdmin: jest.fn(() => ({
    collectionGroup: mockCollectionGroup,
    collection: mockCollection,
    batch: mockBatch,
  })),
}));

jest.mock("firebase-admin", () => ({
  __esModule: true,
  default: {
    firestore: {
      Timestamp: {
        fromDate: (d: Date) => ({ toDate: () => d }),
      },
      FieldValue: {
        serverTimestamp: () => "SERVER_TIMESTAMP",
      },
    },
  },
}));

import { POST } from "@/app/api/payjp/route";

function makeRequest(body: object): Request {
  return new Request("http://localhost/api/payjp", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Webhook POST /api/payjp", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("不正なペイロードには400を返す", async () => {
    const res = await POST(makeRequest({}));
    expect(res.status).toBe(400);
  });

  it("未対応のイベントタイプには200を返す", async () => {
    const res = await POST(
      makeRequest({ type: "unknown.event", data: { id: "test" } })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
    expect(json.message).toContain("not handled");
  });

  it("charge.failedイベントを処理して200を返す", async () => {
    const res = await POST(
      makeRequest({
        type: "charge.failed",
        data: {
          id: "ch_test",
          customer: "cus_test",
          failure_message: "Card declined",
        },
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.received).toBe(true);
  });

  it("subscription.renewedでサブスクが見つからない場合200を返す", async () => {
    mockGet.mockResolvedValueOnce({ empty: true, docs: [] });

    const res = await POST(
      makeRequest({
        type: "subscription.renewed",
        data: { id: "sub_test", current_period_end: 1735689600 },
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toContain("not found");
  });

  it("subscription.renewedで有効期限を更新する", async () => {
    const mockDocRef = { update: mockUpdate, parent: { parent: { id: "user123" } } };
    mockGet.mockResolvedValueOnce({
      empty: false,
      docs: [{ ref: mockDocRef, data: () => ({}) }],
    });

    const res = await POST(
      makeRequest({
        type: "subscription.renewed",
        data: { id: "sub_test", current_period_end: 1735689600 },
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toContain("renewed successfully");
    expect(mockUpdate).toHaveBeenCalled();
  });

  it("subscription.deletedで自動更新フラグをオフにする", async () => {
    const mockDocRef = { update: mockUpdate, parent: { parent: { id: "user456" } } };
    mockGet.mockResolvedValueOnce({
      empty: false,
      docs: [{ ref: mockDocRef, data: () => ({}) }],
    });

    const res = await POST(
      makeRequest({
        type: "subscription.deleted",
        data: { id: "sub_del" },
      })
    );
    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.message).toContain("deletion recorded");
    expect(mockUpdate).toHaveBeenCalledWith(
      expect.objectContaining({ automaticRenewalFlag: false })
    );
  });
});
