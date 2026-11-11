// @opennextjs/cloudflare 설정. 앱이 거의 전부 동적(API + 클라이언트 페이지)이라 R2 캐시는 쓰지 않는다.
import { defineCloudflareConfig } from "@opennextjs/cloudflare";

export default defineCloudflareConfig({});
