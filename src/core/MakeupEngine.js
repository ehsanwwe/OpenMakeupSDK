import {
    Group,
    LinearFilter,
    OrthographicCamera,
    RGBAFormat,
    Scene,
    Vector2,
    Vector4,
    WebGLRenderer,
    VideoTexture,
    MeshBasicMaterial,
    PlaneGeometry,
    SRGBColorSpace,
    Mesh,
    ClampToEdgeWrapping,
    TextureLoader,
    Float32BufferAttribute,
} from 'three';

import { FaceMeshModelController } from './FaceMeshModelController.js';
import {
    createLeftEyeNurbsMesh,
    createRightEyeNurbsMesh,
    updateFaceNurbsMesh,
} from './FaceNurbsModelController.js';
import {
    loadBlurMat,
    loadBlushMat,
    loadEyeLineMat,
    loadEyeShadowMat,
    loadFoundationMat,
    loadLipMats,
    loadMascaraMat,
} from './materials.js';
import { loadFaceWarpMat } from './faceWarpMaterial.js';
import { createAssetResolver, defaultConfig, resolveAsset } from '../config.js';
import { resolveMorphTarget } from '../morphs.js';

/** Convert a '#rrggbb' string to a THREE.Vector4 with alpha 1. */
function hexToVector4(hex) {
    const cleanHex = String(hex).replace(/^#/, '');
    const r = parseInt(cleanHex.slice(0, 2), 16);
    const g = parseInt(cleanHex.slice(2, 4), 16);
    const b = parseInt(cleanHex.slice(4, 6), 16);
    return new Vector4(r / 255, g / 255, b / 255, 1);
}

/**
 * MakeupEngine — the real-time AR makeup renderer.
 *
 * Instantiable and DOM-decoupled: pass in your own <video> and canvas elements
 * and a configurable asset base. The old document CustomEvents (setAR /
 * setPattern / ClearAll / ClearPartOfMakeUp) are now methods.
 *
 * MediaPipe FaceMesh / Camera are NOT imported here (the legacy @mediapipe
 * packages are global-script libraries that break ESM bundlers). Instead they
 * are taken from `window.FaceMesh` / `window.Camera` (load them via a <script>
 * tag) or injected via the `faceMeshClass` / `cameraClass` options.
 */
export class MakeupEngine {
    /**
     * @param {object} options
     * @param {HTMLVideoElement}  options.video         camera video element (required)
     * @param {HTMLCanvasElement} options.renderCanvas  WebGL output canvas (required)
     * @param {HTMLCanvasElement} [options.overlayCanvas] optional 2D overlay canvas
     * @param {string} [options.assetsBaseUrl]    base path for shaders/models/patterns
     * @param {string} [options.mediapipeBaseUrl] base path for the MediaPipe runtime files
     * @param {object} [options.faceMesh]         MediaPipe FaceMesh options override
     * @param {object} [options.camera]           { width, height } override
     * @param {Function} [options.faceMeshClass]  MediaPipe FaceMesh class (defaults to window.FaceMesh)
     * @param {Function} [options.cameraClass]    MediaPipe Camera class (defaults to window.Camera)
     */
    constructor(options = {}) {
        const {
            video,
            renderCanvas,
            overlayCanvas = null,
            assetsBaseUrl,
            mediapipeBaseUrl,
            faceMesh,
            camera,
            faceMeshClass,
            cameraClass,
        } = options;

        if (!video) throw new Error('MakeupEngine: `video` element is required');
        if (!renderCanvas) throw new Error('MakeupEngine: `renderCanvas` element is required');

        this.video = video;
        this.renderCanvas = renderCanvas;
        this.overlayCanvas = overlayCanvas;
        this.overlayCtx = overlayCanvas ? overlayCanvas.getContext('2d') : null;

        this.assets = createAssetResolver(assetsBaseUrl ?? defaultConfig.assetsBaseUrl);
        this.mediapipeBaseUrl = mediapipeBaseUrl ?? defaultConfig.mediapipeBaseUrl;
        this.config = {
            faceMesh: { ...defaultConfig.faceMesh, ...(faceMesh || {}) },
            camera: { ...defaultConfig.camera, ...(camera || {}) },
        };

        // MediaPipe classes (injected or resolved from globals at init)
        this._FaceMeshClass = faceMeshClass || null;
        this._CameraClass = cameraClass || null;

        // three.js state
        this.scene = null;
        this.camera3D = null;
        this.renderer = null;
        this.sceneSize = new Vector2();
        this.videoTexture = null;
        this.videoPlane = null;

        // face model + makeup
        this.faceModel = null;
        this.faceObject3D = null;
        this.blureMesh = null;
        this.blushMesh = null;
        this.lipsMesh = null;
        this.eyeShadowMesh = null;
        this.foundationMesh = null;
        this.eyeLineLeftNurbs = null;
        this.eyeLineRightNurbs = null;
        this.mascaraLeftNurbs = null;
        this.mascaraRightNurbs = null;

        this.blurMat = null;
        this.blushMat = null;
        this.lipsMat = null;
        this.eyeShadowMat = null;
        this.foundationMat = null;
        this.eyeLineMat = null;
        this.mascaraMat = null;

        this._texLoader = new TextureLoader();
        this._rafId = null;
        this._camera = null;
        this._faceMesh = null;
        this._ready = false;

        // face reshape (morph) state
        this.faceVideoMesh = null;     // camera video projected onto the morphable face mesh
        this.wireMesh = null;          // debug wireframe of the morphed mesh
        this._morphReady = false;
        this._morphDeltas = null;      // geometry.morphAttributes.position (deltas per target)
        this._morphDict = null;        // glb target name -> index
        this._morphInfluences = null;  // Float32Array, one weight per target
        this._basePos = null;          // unmorphed fit position attribute (for the warp shader)
        this._pendingMorph = {};       // morph() calls made before the model finished loading
        this._morphModelIPD = null;    // eye distance in the original model space (scale ref)
        this.morphGain = 1.0;          // global multiplier for morph strength (tunable)
    }

    /** Set up the scene, load the face model + materials, start tracking. */
    async init(onReady) {
        this._resolveMediaPipeClasses();

        this._setupScene();
        this._sizeToVideoBox();
        window.addEventListener('resize', this._sizeToVideoBox);
        this.video.addEventListener('loadedmetadata', this._sizeToVideoBox);
        if (this.overlayCanvas) {
            this._resizeOverlay();
            window.addEventListener('resize', this._resizeOverlay);
        }

        await this._loadFaceAndMaterials();

        this._setupFaceMesh();
        this._setupCamera();

        this._animate();
        this._camera.start();

        this._ready = true;
        if (onReady) onReady(this);
        return this;
    }

    _resolveMediaPipeClasses() {
        if (!this._FaceMeshClass && typeof window !== 'undefined') this._FaceMeshClass = window.FaceMesh;
        if (!this._CameraClass && typeof window !== 'undefined') this._CameraClass = window.Camera;
        if (!this._FaceMeshClass) {
            throw new Error('OpenMakeupSDK: MediaPipe FaceMesh not found. Load @mediapipe/face_mesh (window.FaceMesh) via a <script> tag, or pass `faceMeshClass`.');
        }
        if (!this._CameraClass) {
            throw new Error('OpenMakeupSDK: MediaPipe Camera not found. Load @mediapipe/camera_utils (window.Camera) via a <script> tag, or pass `cameraClass`.');
        }
    }

    _setupScene() {
        this.scene = new Scene();
        const width = window.innerWidth;
        const height = window.innerHeight;

        this.camera3D = new OrthographicCamera(
            -width / 2, width / 2,
            height / 2, -height / 2,
            200, 1000,
        );
        this.camera3D.position.set(0, 0, 500);
        this.camera3D.lookAt(0, 0, 0);
        this.camera3D.updateProjectionMatrix();

        this.renderer = new WebGLRenderer({
            canvas: this.renderCanvas,
            alpha: true,
            antialias: true,
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);

        this.videoTexture = new VideoTexture(this.video);
        this.videoTexture.minFilter = LinearFilter;
        this.videoTexture.magFilter = LinearFilter;
        this.videoTexture.format = RGBAFormat;
        this.videoTexture.colorSpace = SRGBColorSpace;
        const videoMaterial = new MeshBasicMaterial({ map: this.videoTexture });
        this.videoPlane = new Mesh(new PlaneGeometry(1, 1), videoMaterial);
        this.videoPlane.renderOrder = -10;
        this.scene.add(this.videoPlane);
    }

    _sizeToVideoBox = () => {
        const container = this.video.parentElement;
        if (!container) return;
        const containerWidth = container.clientWidth;
        const containerHeight = container.clientHeight;

        const vidW = this.video.videoWidth || containerWidth;
        const vidH = this.video.videoHeight || containerHeight;

        const videoAspect = vidW / vidH;
        const containerAspect = containerWidth / containerHeight;

        let targetWidth;
        let targetHeight;

        if (videoAspect > containerAspect) {
            targetHeight = containerHeight;
            targetWidth = Math.round(targetHeight * videoAspect);
        } else {
            targetWidth = containerWidth;
            targetHeight = Math.round(targetWidth / videoAspect);
        }

        this.sceneSize.set(targetWidth, targetHeight);

        const dpr = Math.max(1, window.devicePixelRatio || 1);
        this.renderer.setPixelRatio(dpr);
        this.renderer.setSize(targetWidth, targetHeight, false);

        const el = this.renderer.domElement;
        el.style.position = 'absolute';
        el.style.left = `${Math.round((containerWidth - targetWidth) / 2)}px`;
        el.style.top = `${Math.round((containerHeight - targetHeight) / 2)}px`;
        el.style.pointerEvents = 'none';
        el.style.maxWidth = 'none';
        el.style.width = `${targetWidth}px`;
        el.style.height = `${targetHeight}px`;

        this.camera3D.left = -targetWidth / 2;
        this.camera3D.right = targetWidth / 2;
        this.camera3D.top = targetHeight / 2;
        this.camera3D.bottom = -targetHeight / 2;
        this.camera3D.updateProjectionMatrix();

        if (this.videoPlane && this.videoPlane.geometry) {
            this.videoPlane.geometry.dispose();
        }
        this.videoPlane.geometry = new PlaneGeometry(targetWidth, targetHeight);
        this.videoPlane.position.set(0, 0, 0);
    };

    _resizeOverlay = () => {
        if (!this.overlayCanvas) return;
        this.overlayCanvas.width = window.innerWidth;
        this.overlayCanvas.height = window.innerHeight;
    };

    async _loadFaceAndMaterials() {
        this.faceModel = new FaceMeshModelController(
            this.assets.model('face.glb'),
            this.sceneSize,
            this.scene,
        );

        await new Promise((resolve) => {
            this.faceModel.loadModel((mesh) => {
                this.faceObject3D = new Group();
                mesh.visible = false;
                this.faceObject3D.add(mesh);
                this.scene.add(this.faceObject3D);

                // morph buffers (shared geometry) + the camera-on-face warp mesh
                this._ensureMorphBuffers();
                loadFaceWarpMat(this.assets, this.videoTexture).then((mat) => {
                    this.faceVideoMesh = new Mesh(mesh.geometry, mat);
                    this.faceVideoMesh.renderOrder = 1; // above the background plane + blur, below makeup colors
                    this.faceVideoMesh.position.setZ(0.5);
                    this.faceVideoMesh.frustumCulled = false;
                    this.faceObject3D.add(this.faceVideoMesh);
                });

                // debug wireframe of the (CPU-morphed) shared geometry — toggle with setWireframe()
                const wireMat = new MeshBasicMaterial({
                    color: 0x00ff88, wireframe: true,
                    transparent: true, opacity: 0.9,
                    depthTest: false, depthWrite: false,
                });
                this.wireMesh = new Mesh(mesh.geometry, wireMat);
                this.wireMesh.renderOrder = 999;
                this.wireMesh.frustumCulled = false;
                this.wireMesh.visible = false;
                this.faceObject3D.add(this.wireMesh);

                const refractUniforms = {
                    tScene: { value: this.videoTexture },
                    transmission: { value: 1.0 },
                    roughTransmission: { value: 0.4 },
                    resolution: { value: new Vector2(window.innerWidth, window.innerHeight) },
                    strength: { value: 1.0 },
                    ior: { value: 1.0 },
                };
                loadBlurMat(this.assets, refractUniforms).then((material) => {
                    this.blureMesh = new Mesh(mesh.geometry, material);
                    this.blureMesh.renderOrder = 0;
                    this.blureMesh.position.setZ(0);
                    this.blureMesh.visible = false; // off by default — it was covering the warp/face
                    this.faceObject3D.add(this.blureMesh);
                });

                loadBlushMat(this.assets).then((material) => {
                    this.blushMat = material;
                    this.blushMat.needsUpdate = true;
                    this.blushMesh = new Mesh(mesh.geometry, this.blushMat);
                    this.blushMesh.renderOrder = 2;
                    this.blushMesh.position.setZ(2);
                    this.blushMesh.visible = false;
                    this.faceObject3D.add(this.blushMesh);
                });

                loadLipMats(this.assets).then((material) => {
                    this.lipsMat = material;
                    this.lipsMat.needsUpdate = true;
                    this.lipsMesh = new Mesh(mesh.geometry, this.lipsMat);
                    this.lipsMesh.renderOrder = 3;
                    this.lipsMesh.position.setZ(3);
                    this.lipsMesh.visible = false;
                    this.faceObject3D.add(this.lipsMesh);
                });

                loadEyeShadowMat(this.assets).then((material) => {
                    this.eyeShadowMat = material;
                    this.eyeShadowMat.needsUpdate = true;
                    this.eyeShadowMesh = new Mesh(mesh.geometry, this.eyeShadowMat);
                    this.eyeShadowMesh.renderOrder = 3;
                    this.eyeShadowMesh.position.setZ(3);
                    this.eyeShadowMesh.visible = false;
                    this.faceObject3D.add(this.eyeShadowMesh);
                });

                loadFoundationMat(this.assets).then((material) => {
                    this.foundationMat = material;
                    this.foundationMat.needsUpdate = true;
                    this.foundationMesh = new Mesh(mesh.geometry, this.foundationMat);
                    this.foundationMesh.renderOrder = 1;
                    this.foundationMesh.position.setZ(1);
                    this.foundationMesh.visible = false;
                    this.faceObject3D.add(this.foundationMesh);
                });

                loadEyeLineMat(this.assets).then((material) => {
                    this.eyeLineMat = material;
                    this.eyeLineMat.needsUpdate = true;
                    this.eyeLineLeftNurbs = createLeftEyeNurbsMesh([], this.eyeLineMat, this.sceneSize.x, this.sceneSize.y);
                    this.eyeLineLeftNurbs.mesh.renderOrder = 14;
                    this.eyeLineLeftNurbs.mesh.position.setZ(15);
                    this.eyeLineLeftNurbs.mesh.visible = false;
                    this.scene.add(this.eyeLineLeftNurbs.mesh);
                    this.eyeLineRightNurbs = createRightEyeNurbsMesh([], this.eyeLineMat, this.sceneSize.x, this.sceneSize.y);
                    this.eyeLineRightNurbs.mesh.renderOrder = 14;
                    this.eyeLineRightNurbs.mesh.position.setZ(15);
                    this.eyeLineRightNurbs.mesh.visible = false;
                    this.scene.add(this.eyeLineRightNurbs.mesh);
                });

                loadMascaraMat(this.assets).then((material) => {
                    this.mascaraMat = material;
                    this.mascaraMat.needsUpdate = true;
                    this.mascaraLeftNurbs = createLeftEyeNurbsMesh([], this.mascaraMat, this.sceneSize.x, this.sceneSize.y);
                    this.mascaraLeftNurbs.mesh.renderOrder = 15;
                    this.mascaraLeftNurbs.mesh.position.setZ(50);
                    this.mascaraLeftNurbs.mesh.visible = false;
                    this.scene.add(this.mascaraLeftNurbs.mesh);
                    this.mascaraRightNurbs = createRightEyeNurbsMesh([], this.mascaraMat, this.sceneSize.x, this.sceneSize.y);
                    this.mascaraRightNurbs.mesh.renderOrder = 15;
                    this.mascaraRightNurbs.mesh.visible = false;
                    this.scene.add(this.mascaraRightNurbs.mesh);
                });

                resolve();
            });
        });
    }

    _setupFaceMesh() {
        this._faceMesh = new this._FaceMeshClass({
            locateFile: (file) => resolveAsset(this.mediapipeBaseUrl, file),
        });
        this._faceMesh.setOptions(this.config.faceMesh);
        this._faceMesh.onResults(this._onResults);
    }

    _setupCamera() {
        this._camera = new this._CameraClass(this.video, {
            onFrame: async () => {
                await this._faceMesh.send({ image: this.video });
            },
            width: this.config.camera.width,
            height: this.config.camera.height,
        });
    }

    _onResults = (results) => {
        if (this.overlayCtx) {
            this.overlayCtx.clearRect(0, 0, this.overlayCanvas.width, this.overlayCanvas.height);
        }

        if (results.multiFaceLandmarks?.length) {
            const landmarks = results.multiFaceLandmarks[0];
            if (!landmarks.length) return;

            if (this.faceModel && this.faceModel.scene != null) {
                this.faceModel.updateWithLandmarks(landmarks);
                this._applyMorph();
                if (this.lipsMat) this.faceModel.calculateLipOpen(landmarks, this.lipsMat);

                if (this.eyeLineLeftNurbs) updateFaceNurbsMesh(landmarks, this.eyeLineLeftNurbs, this.sceneSize.x, this.sceneSize.y, true);
                if (this.eyeLineRightNurbs) updateFaceNurbsMesh(landmarks, this.eyeLineRightNurbs, this.sceneSize.x, this.sceneSize.y, false);
                if (this.mascaraLeftNurbs) updateFaceNurbsMesh(landmarks, this.mascaraLeftNurbs, this.sceneSize.x, this.sceneSize.y, true);
                if (this.mascaraRightNurbs) updateFaceNurbsMesh(landmarks, this.mascaraRightNurbs, this.sceneSize.x, this.sceneSize.y, false);
            }

            this.renderer.render(this.scene, this.camera3D);
        }
    };

    _animate = () => {
        this._rafId = requestAnimationFrame(this._animate);
        if (this.renderer) this.renderer.render(this.scene, this.camera3D);
    };

    /* ───────────────────────── control API (was DOM events) ───────────────────────── */

    /** Apply / update a makeup layer. (was the `setAR` event) */
    setAR(arType, colorCode, colorMode) {
        try {
            if (arType === 'foundation' && this.foundationMat) {
                this.foundationMesh.visible = true;
                this.foundationMat.uniforms._MainColor.value = hexToVector4(colorCode);
                if (colorMode == '5') this.foundationMat.uniforms._noise.value = 1;
                if (colorMode == '7') this.foundationMat.uniforms._noise.value = 0.7;
                if (colorMode == '1') this.foundationMat.uniforms._noise.value = 0;
            }
            if (arType === 'blush' && this.blushMat) {
                this.blushMesh.visible = true;
                this.blushMat.uniforms._ShadowColor.value = hexToVector4(colorCode);
                if (colorMode == '5') this.blushMat.uniforms._noise.value = 1;
                if (colorMode == '7') this.blushMat.uniforms._noise.value = 0.7;
                if (colorMode == '1') this.blushMat.uniforms._noise.value = 0;
            }
            if (arType === 'lens') {
                // reserved
            }
            if (arType === 'lipstick' && this.lipsMat) {
                this.lipsMesh.visible = true;
                this.lipsMat.uniforms._MainColor.value = hexToVector4(colorCode);
                if (colorMode == '5') { this.lipsMat.uniforms._shine.value = 0.3; this.lipsMat.uniforms._bright.value = 0.6; }
                if (colorMode == '7') { this.lipsMat.uniforms._shine.value = 0.5; this.lipsMat.uniforms._bright.value = 0.0; }
                if (colorMode == '2') { this.lipsMat.uniforms._shine.value = 0.9; this.lipsMat.uniforms._bright.value = 0.0; }
                if (colorMode == '1') { this.lipsMat.uniforms._shine.value = 0.0; this.lipsMat.uniforms._bright.value = 0.0; }
            }
            if (arType === 'eyeshadow' && this.eyeShadowMat) {
                this.eyeShadowMesh.visible = true;
                this.eyeShadowMat.uniforms._ShadowColor.value = hexToVector4(colorCode);
                this.eyeShadowMat.needsUpdate = true;
                if (colorMode == '5') this.eyeShadowMat.uniforms._noise.value = 1;
                if (colorMode == '7') this.eyeShadowMat.uniforms._noise.value = 7;
                if (colorMode == '1') this.eyeShadowMat.uniforms._noise.value = 0;
            }
            if (arType === 'eyeline' && this.eyeLineMat) {
                this.eyeLineLeftNurbs.mesh.visible = true;
                this.eyeLineRightNurbs.mesh.visible = true;
                this.eyeLineMat.uniforms.color.value = hexToVector4(colorCode);
            }
            if (arType === 'mascara' && this.mascaraMat) {
                this.mascaraLeftNurbs.mesh.visible = true;
                this.mascaraRightNurbs.mesh.visible = true;
                this.mascaraMat.uniforms.color.value = hexToVector4(colorCode);
            }
        } catch (e) {
            // a layer may not be loaded yet
        }
    }

    /** Hide every makeup layer. (was the `ClearAll` event) */
    clearAll() {
        if (this.blushMesh) this.blushMesh.visible = false;
        if (this.eyeShadowMesh) this.eyeShadowMesh.visible = false;
        if (this.foundationMesh) this.foundationMesh.visible = false;
        if (this.lipsMesh) this.lipsMesh.visible = false;
        if (this.eyeLineLeftNurbs) this.eyeLineLeftNurbs.mesh.visible = false;
        if (this.eyeLineRightNurbs) this.eyeLineRightNurbs.mesh.visible = false;
        if (this.mascaraLeftNurbs) this.mascaraLeftNurbs.mesh.visible = false;
        if (this.mascaraRightNurbs) this.mascaraRightNurbs.mesh.visible = false;
    }

    /** Hide one makeup layer. (was the `ClearPartOfMakeUp` event) */
    clearPart(action) {
        if (action === 'foundation' && this.foundationMesh) this.foundationMesh.visible = false;
        if (action === 'blush' && this.blushMesh) this.blushMesh.visible = false;
        if (action === 'lipstick' && this.lipsMesh) this.lipsMesh.visible = false;
        if (action === 'eyeline') {
            if (this.eyeLineLeftNurbs) this.eyeLineLeftNurbs.mesh.visible = false;
            if (this.eyeLineRightNurbs) this.eyeLineRightNurbs.mesh.visible = false;
        }
        if (action === 'mascara') {
            if (this.mascaraLeftNurbs) this.mascaraLeftNurbs.mesh.visible = false;
            if (this.mascaraRightNurbs) this.mascaraRightNurbs.mesh.visible = false;
        }
        if (action === 'eyeshadow' && this.eyeShadowMesh) this.eyeShadowMesh.visible = false;
    }

    /** Set the pattern texture for a makeup type. (was the `setPattern` event) */
    async setPattern(armode, imageId) {
        const tex = await this._fetchPatternTexture(armode, imageId);
        if (armode === 'foundation' && this.foundationMat) {
            this.foundationMat.uniforms._Mask.value = tex;
        }
        if (armode === 'eyeline' && this.eyeLineMat) {
            tex.flipY = true;
            this.eyeLineMat.uniforms.map.value = tex;
        }
        if (armode === 'mascara' && this.mascaraMat) {
            tex.flipY = true;
            this.mascaraMat.uniforms.map.value = tex;
        }
        if (armode === 'eyeshadow' && this.eyeShadowMat) {
            this.eyeShadowMat.uniforms._EyeShadowTexture.value = tex;
        }
    }

    /** Load a pattern texture from assets/patterns/<type>/<id>.png (no hardcoded host). */
    _fetchPatternTexture(armode, id) {
        const url = this.assets.pattern(armode, id);
        return new Promise((resolve, reject) => {
            this._texLoader.load(
                url,
                (texture) => {
                    texture.format = RGBAFormat;
                    texture.minFilter = LinearFilter;
                    texture.magFilter = LinearFilter;
                    texture.wrapS = ClampToEdgeWrapping;
                    texture.wrapT = ClampToEdgeWrapping;
                    texture.flipY = false;
                    resolve(texture);
                },
                undefined,
                (err) => reject(err),
            );
        });
    }

    /* ───────────────────────── face reshape (morph) ───────────────────────── */

    _ensureMorphBuffers() {
        if (this._morphReady) return;
        const mesh = this.faceModel && this.faceModel.mesh;
        const geo = mesh && mesh.geometry;
        if (!geo || !geo.attributes.position) return;

        // unmorphed fit position, consumed by the warp shader as `aBasePos`
        const len = geo.attributes.position.array.length;
        this._basePos = new Float32BufferAttribute(new Float32Array(len), 3);
        geo.setAttribute('aBasePos', this._basePos);

        this._morphDeltas = (geo.morphAttributes && geo.morphAttributes.position) || [];
        this._morphDict = mesh.morphTargetDictionary || {};
        this._morphInfluences = new Float32Array(this._morphDeltas.length);
        this._morphReady = true;

        console.info(
            `OpenMakeupSDK: morph targets loaded = ${this._morphDeltas.length}`,
            Object.keys(this._morphDict),
        );
        if (this._morphDeltas.length === 0) {
            console.warn('OpenMakeupSDK: no morph attributes on the geometry — face.glb may have been exported without morph targets, or the loader dropped them.');
        }

        // flush any morph() calls made before the model was ready
        const pending = this._pendingMorph;
        this._pendingMorph = {};
        for (const name in pending) this.setMorph(name, pending[name]);
    }

    _applyMorph() {
        if (!this._morphReady) return;
        const geo = this.faceModel.mesh.geometry;
        const pos = geo.attributes.position;
        const arr = pos.array;

        // capture the unmorphed landmark-fit (just written by updateWithLandmarks)
        this._basePos.array.set(arr);
        this._basePos.needsUpdate = true;

        // The morph deltas live in the original model space (Z-up, model scale).
        // The live mesh is the landmark fit (Y-up, pixel scale). Convert:
        //   - scale by eye-distance ratio (model -> live)
        //   - swap Y/Z so model "height" (Z) maps to live "up" (Y)
        const k = this._morphScale() * this.morphGain;

        let any = false;
        for (let m = 0; m < this._morphInfluences.length; m++) {
            const infl = this._morphInfluences[m];
            if (!infl) continue;
            any = true;
            const d = this._morphDeltas[m].array;
            const w = infl * k;
            for (let i = 0; i < arr.length; i += 3) {
                arr[i]     += w * d[i];       // X  (width)        <- model X
                arr[i + 1] += w * d[i + 2];   // Y  (live up)      <- model Z (height)
                arr[i + 2] += w * d[i + 1];   // Z  (live depth)   <- model Y (depth)
            }
        }
        if (any) {
            pos.needsUpdate = true;
            geo.computeVertexNormals();
        }
    }

    /** Scale factor mapping model-space deltas into the live landmark-fit space. */
    _morphScale() {
        const op = this.faceModel && this.faceModel.originalPositions;
        if (!op) return 1;
        if (this._morphModelIPD == null) this._morphModelIPD = this._ipd(op, 33, 263);
        if (!this._morphModelIPD) return 1;
        const liveIPD = this._ipd(this._basePos.array, 33, 263);
        return liveIPD / this._morphModelIPD;
    }

    _ipd(a, i, j) {
        const dx = a[i * 3] - a[j * 3];
        const dy = a[i * 3 + 1] - a[j * 3 + 1];
        const dz = a[i * 3 + 2] - a[j * 3 + 2];
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }

    /** Set one reshape control (friendly name from morphs.js, or a raw glb target). */
    setMorph(name, value) {
        if (!this._morphReady) { this._pendingMorph[name] = value; return; }
        const target = resolveMorphTarget(name);
        const idx = this._morphDict[target];
        if (idx == null) { console.warn(`OpenMakeupSDK: unknown morph "${name}"`); return; }
        this._morphInfluences[idx] = value;
    }

    /** Apply a map of reshape controls, e.g. { noseSlim: 0.6, cheeks: 0.3 }. */
    morph(map = {}) {
        for (const name in map) this.setMorph(name, map[name]);
    }

    /** Reset all reshape controls to 0. */
    resetMorph() {
        if (this._morphInfluences) this._morphInfluences.fill(0);
        this._pendingMorph = {};
    }

    /** Available morph target names baked into the model. */
    getMorphTargets() {
        return this._morphDict ? Object.keys(this._morphDict) : [];
    }

    /* ───────────────────────── debug ───────────────────────── */

    /** Show/hide a wireframe of the morphed face mesh (to verify morph deformation). */
    setWireframe(on) {
        if (this.wireMesh) this.wireMesh.visible = !!on;
    }

    /** Show/hide the blur/refraction layer (off by default — it covers the warp). */
    setBlur(on) {
        if (this.blureMesh) this.blureMesh.visible = !!on;
    }

    /* ───────────────────────── lifecycle ───────────────────────── */

    start() {
        if (this._camera) this._camera.start();
        if (this._rafId == null) this._animate();
    }

    stop() {
        if (this._camera && this._camera.stop) this._camera.stop();
        if (this._rafId != null) {
            cancelAnimationFrame(this._rafId);
            this._rafId = null;
        }
    }

    dispose() {
        this.stop();
        window.removeEventListener('resize', this._sizeToVideoBox);
        window.removeEventListener('resize', this._resizeOverlay);
        this.video.removeEventListener('loadedmetadata', this._sizeToVideoBox);
        if (this._faceMesh && this._faceMesh.close) this._faceMesh.close();
        if (this.renderer) this.renderer.dispose();
    }
}
