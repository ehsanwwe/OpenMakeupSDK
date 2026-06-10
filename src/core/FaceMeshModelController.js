import {
    Vector3,
    AxesHelper,
    Matrix4, Matrix3, Euler, MathUtils, Quaternion
} from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const IDX = { R_EYE:33, L_EYE:263, NOSE:1, CHIN:152, FOREHEAD:10 };
export class FaceMeshModelController {
    constructor( modelPath,  sceneSize , scene) {
        this.modelPath = modelPath;
        this.sceneSize = sceneSize;
        this.scene = scene;
        this.mesh = null;
        this.loadModel();
        this._axes = null;
        this._modelIPD = null; // فاصله بین چشم‌ها در مدل (برای مقیاس‌دهی)
    }
    normalizedToWorld(nx, ny, nz, W, H, depthScale=100){
        const px = nx * W;
        const py = ny * H;
        const x = px - W/2;
        const y = H/2 - py;
        const z = -(nz - 0.5) * depthScale;
        // نگاشت به سیستم مختصات سه‌بعدی‌ات (Y-up, Z-forward)
        return new Vector3(x, y, z);
    }
    // محاسبه پوز سر (T,R,S) از لندمارک‌ها
    computeHeadPose(landmarks, W, H) {
        const pR = this.normalizedToWorld(landmarks[IDX.R_EYE].x, landmarks[IDX.R_EYE].y, landmarks[IDX.R_EYE].z, W, H);
        const pL = this.normalizedToWorld(landmarks[IDX.L_EYE].x, landmarks[IDX.L_EYE].y, landmarks[IDX.L_EYE].z, W, H);
        const pN = this.normalizedToWorld(landmarks[IDX.NOSE].x,   landmarks[IDX.NOSE].y,   landmarks[IDX.NOSE].z,   W, H);
        const pC = this.normalizedToWorld(landmarks[IDX.CHIN].x,   landmarks[IDX.CHIN].y,   landmarks[IDX.CHIN].z,   W, H);
        const pF = this.normalizedToWorld(landmarks[IDX.FOREHEAD].x, landmarks[IDX.FOREHEAD].y, landmarks[IDX.FOREHEAD].z, W, H);

        // محور x صورت: از راست به چپ
        const xDir = new Vector3().subVectors(pL, pR).normalize();

        // محور y صورت: از چانه به پیشانی
        const yDir = new Vector3().subVectors(pF, pC).normalize();

        // محور z صورت: right-handed
        const zDir = new Vector3().crossVectors(xDir, yDir).normalize();

        // بازنرمال‌سازی یدکی برای عمود بودن محورها
        yDir.crossVectors(zDir, xDir).normalize();

        // ماتریس چرخش از بیس‌های محلی صورت
        const rot = new Matrix4().makeBasis(xDir, yDir, zDir);
        const quat = new Quaternion().setFromRotationMatrix(rot);

        // ترجمه: مرکز بین چشم‌ها را مبنا بگیر
        const centerEyes = new Vector3().addVectors(pL, pR).multiplyScalar(0.5);

        // مقیاس: نسبت فاصله چشم‌ها به فاصله مدل
        const ipdWorld = pL.distanceTo(pR);
        let s = 1.0;
        if (this._modelIPD && this._modelIPD > 1e-6) {
            s = ipdWorld / this._modelIPD;
        }

        return { position: centerEyes, rotation: quat, rotM4: rot, scale: s };
    }
    loadModel(onLoad) {
        const loader = new GLTFLoader();
        loader.load(this.modelPath, (gltf) => {
            let mesh  = null;
            gltf.scene.traverse((child) => {
                if (child.isMesh && !mesh) mesh = child;
            });
            if (!mesh) {
                console.error("❌ هیچ مشی در مدل پیدا نشد");
                return;
            }

            const geo  = mesh.geometry;

            const posAttr = geo.attributes.position;
            if (!geo.attributes.position) {
                console.error("❌ geometry فاقد position است");
                return;
            }
            if (geo.attributes.uv) {
                geo.setAttribute('uvLip', geo.attributes['texcoord_4']);
                geo.setAttribute('uvEyeShadow', geo.attributes['uv3']);
            } else {
                console.error('No base UV found to create uvLip');
            }



            geo.computeVertexNormals();

            this.mesh = mesh;
            if (!this._axes) {
                this._axes = new AxesHelper(50);
                this._axes.renderOrder = 999;
                this._axes.depthTest = false;
                mesh.add(this._axes);
            }

            this.originalPositions = posAttr.array.slice();

            // Call the callback with the loaded mesh
            if (onLoad) onLoad(this.mesh);
        });
    }
    updateWithLandmarks(landmarks) {
        if (!this.mesh) return;


        const geo = this.mesh.geometry;
        const posAttr = geo.attributes.position;
        const W = this.sceneSize.x;
        const H = this.sceneSize.y;

        // 1) پوز سر از لندمارک‌ها
        const { position: T, rotation: Q, rotM4: Rm4, scale: S } = this.computeHeadPose(landmarks, W, H);

        // اعمال پوز روی مش (AxesHelper هم همراه می‌شود)
        if (this.mesh.parent) {
            this.mesh.parent.position.copy(T);
            this.mesh.parent.quaternion.copy(Q);
            this.mesh.parent.scale.setScalar(S);
        }
        // this.mesh.position.copy(T);
        // this.mesh.quaternion.copy(Q);
        // this.mesh.scale.setScalar(S);

        // 2) ماتریس معکوس چرخش (برای برگرداندن نقاط به فضای محلی)
        const R_inv = new Matrix4().copy(Rm4).invert();
        const normalRInv = new Matrix3().setFromMatrix4(R_inv);

        // 3) پر کردن هندسه با نقاط در فضای محلی
        const v = new Vector3();
        for (let i = 0; i < posAttr.count && i < landmarks.length; i++) {
            const lm = landmarks[i];
            // جهان
            const Pw = this.normalizedToWorld(lm.x, lm.y, lm.z, W, H);

            // به فضای محلی: اول کم‌کردن ترجمه، بعد چرخش معکوس، بعد تقسیم بر مقیاس
            v.copy(Pw).sub(T);
            v.applyMatrix3(normalRInv);
            v.multiplyScalar(1.0 / (S || 1.0));

            posAttr.setXYZ(i, v.x, v.y, v.z);
        }

        posAttr.needsUpdate = true;
        geo.computeVertexNormals();
        // 4) نمایش Yaw روی AxesHelper (اختیاری): Yaw را از کواترنیون استخراج کن
        //   توجه: تعریف Yaw اینجاست حول محور Y مدل (با فرض Y-up)
        const euler = new Euler().setFromQuaternion(Q, 'YXZ'); // Yaw-Pitch-Roll
        const yawDeg = MathUtils.radToDeg(euler.y);
        // اگر خواستی برای دیباگ لاگ بگیری:
        // /* ehsan debug  console.log('Yaw°:', yawDeg.toFixed(1)) */
    }
    calculateLipOpen(vertices,lipsMat) {
        // vertices آرایه‌ای از Vector3 یا آبجکت با x, y, z
        const v11 = new Vector3(vertices[11].x, vertices[11].y, vertices[11].z);
        const v14 = new Vector3(vertices[14].x, vertices[14].y, vertices[14].z);
        const v86 = new Vector3(vertices[86].x, vertices[86].y, vertices[86].z);
        const v316 = new Vector3(vertices[316].x, vertices[316].y, vertices[316].z);

        // محاسبه فاصله‌ها
        const lipsVeticDistance = v11.distanceTo(v14);
        const lipsHorizDistance = v86.distanceTo(v316);

        // مشابه کد یونیتی
        let lipsOpen;
        if (lipsHorizDistance > lipsVeticDistance) {
            lipsOpen = lipsVeticDistance / lipsHorizDistance;
        } else {
            lipsOpen = 1.0;
        }
        let normalized = (lipsOpen - 0.5) / (1.0 - 0.5);
        // clamp برای اطمینان
        normalized = Math.max(0, Math.min(1, normalized));

        lipsMat.uniforms._lipOpen.value = normalized;
    }
}
