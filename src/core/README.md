# core/

The rendering engine modules land here (ported from the existing engine, with
all hardcoded URLs replaced by the asset resolver in `../config.js`):

- `OpenMakeup.js`            — main controller / public class (entry, was `main.js`)
- `FaceMeshModelController.js` — maps MediaPipe landmarks onto the 3D face mesh
- `FaceNurbsModelController.js`— NURBS strips for eyeliner / mascara
- `materials.js`            — loads GLSL shaders + builds makeup materials
- `faceAnalyse.js`          — face analysis helpers
- `KalmanFilter2D.js`       — landmark smoothing

Wiring rule: no module may contain an absolute host. All paths go through
`createAssetResolver(config.assetsBaseUrl)`.
