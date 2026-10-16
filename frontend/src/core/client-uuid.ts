/**
 * 客户端唯一ID管理器 (支持匿名持久化与多端记录区分)
 */
export function getClientUuid(): string {
  let uuid = localStorage.getItem("shudu_client_uuid");
  if (!uuid) {
    uuid =
      "client_" +
      Math.random().toString(36).substring(2, 10) +
      "_" +
      Date.now();
    localStorage.setItem("shudu_client_uuid", uuid);
  }
  return uuid;
}
