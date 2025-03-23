import { createAlova, Method } from "alova";
import adapterFetch from "alova/fetch";
import { cookies } from "next/headers";

export const request = createAlova({
  requestAdapter: adapterFetch(),
  baseURL: "http://localhost:3000",
  beforeRequest: async (method: Method) => {
    const accessToken = (await cookies()).get("accessToken")?.value;

    if (accessToken) {
      method.config.headers["Authorization"] = `Bearer ${accessToken}`;
    }
    method.key = method.key + `-${accessToken}`;
  },
  responded: (response) => response.json(),
  cacheLogger: false,
});

export default request;
