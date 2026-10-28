import { SOURCE_TEXT_CACHE_CONTROL, SOURCE_TEXT_NO_STORE, SOURCE_TEXT_KHONG_THE_XU_LY_PROXY_VUI_LONG, SOURCE_TEXT_SYMBOL, SOURCE_TEXT_WORKSPACE, SOURCE_TEXT_IMPORT, SOURCE_TEXT_ID_2, SOURCE_TEXT_ID_CHECK, SOURCE_TEXT_ID_OPEN, SOURCE_TEXT_BROWSER, SOURCE_TEXT_ID_CLOSE } from "../../../../constants/sourceText.js";
import { Router, type Request, type Response } from "express";
import { getProxyService } from "../../../../server/services/proxyService.js";
const router = Router();
router.use((_req, res, next) => {
  res.setHeader(SOURCE_TEXT_CACHE_CONTROL, SOURCE_TEXT_NO_STORE);
  next();
});
const handle = (task: (req: Request) => Promise<unknown>) => async (req: Request, res: Response) => {
  try {
    res.json({ success: true, data: await task(req) });
  } catch (error) {
    const message = error instanceof Error && /[À-ỹ]/.test(error.message) ? error.message : SOURCE_TEXT_KHONG_THE_XU_LY_PROXY_VUI_LONG;
    res.status(400).json({ success: false, error: message });
  }
};
router.get(
  SOURCE_TEXT_SYMBOL,
  handle(() => getProxyService().list()),
);
router.get(
  SOURCE_TEXT_WORKSPACE,
  handle(() => getProxyService().readWorkspace()),
);
router.put(
  SOURCE_TEXT_WORKSPACE,
  handle((req) => getProxyService().saveWorkspace(req.body)),
);
router.post(
  SOURCE_TEXT_SYMBOL,
  handle((req) => getProxyService().save(req.body)),
);
router.post(
  SOURCE_TEXT_IMPORT,
  handle((req) => getProxyService().import(req.body.proxies)),
);
router.put(
  SOURCE_TEXT_ID_2,
  handle((req) => getProxyService().save(req.body, req.params.id)),
);
router.delete(
  SOURCE_TEXT_ID_2,
  handle((req) => getProxyService().remove(req.params.id)),
);
router.post(
  SOURCE_TEXT_ID_CHECK,
  handle((req) => getProxyService().check(req.params.id)),
);
router.post(
  SOURCE_TEXT_ID_OPEN,
  handle((req) => getProxyService().openSession(req.params.id, req.body.destination || SOURCE_TEXT_BROWSER)),
);
router.post(
  SOURCE_TEXT_ID_CLOSE,
  handle((req) => getProxyService().closeSession(req.params.id)),
);
export default router;
