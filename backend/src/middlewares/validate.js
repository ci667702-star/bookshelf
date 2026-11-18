/**
 * Zod 스키마로 요청을 검증하고 결과를 req.valid 에 담는다.
 * (Express 5 의 req.query 는 읽기 전용이므로 덮어쓰지 않음)
 */
export function validate({ body, query, params } = {}) {
  return (req, res, next) => {
    req.valid = {
      body: body ? body.parse(req.body ?? {}) : req.body,
      query: query ? query.parse(req.query ?? {}) : req.query,
      params: params ? params.parse(req.params ?? {}) : req.params,
    };
    next();
  };
}
