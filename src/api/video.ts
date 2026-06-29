

import { post } from "@/utils/http";

export function LoginTop(data) {
  return post('https://xyvision.top/api/login',data)
}
