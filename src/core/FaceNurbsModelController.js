import {
    BufferGeometry,
    Float32BufferAttribute,
    Mesh, MeshBasicMaterial,
    Vector3
} from 'three';
import {NURBSSurface} from "three/examples/jsm/curves/NURBSSurface.js";

const landmarkToWorld = (l, W, H, depthScale = 200) => {
    if (!l) return new Vector3(0,0,0);
    return new Vector3(
        (l.x - 0.5) * W,
        -(l.y - 0.5) * H,
        -(l.z - 0.5) * depthScale
    );
};

// محاسبه درجه خودکار (حداکثر 3)
function getDegree(numPoints) {
    return Math.min(3, numPoints - 1);
}

// تولید بردار knot اتوماتیک (clamped uniform)
function generateKnots(numPoints, degree) {
    const knots = [];
    const n = numPoints - 1;
    const m = n + degree + 1;

    // ابتدا degree بار صفر
    for (let i = 0; i <= degree; i++) {
        knots.push(0);
    }

    // گره‌های داخلی یکنواخت
    for (let i = 1; i <= n - degree; i++) {
        knots.push(i / (n - degree + 1));
    }

    // انتها degree بار یک
    for (let i = 0; i <= degree; i++) {
        knots.push(1);
    }

    return knots;
}


function faceNurbsModelController(controlPoints, mat){

    // استفاده:
    const numU = controlPoints.length;        // 9
    const numV = controlPoints[0].length;     // 4

    const degreeU = getDegree(numU);
    const degreeV = getDegree(numV);

    const knotsU = generateKnots(numU, degreeU);
    const knotsV = generateKnots(numV, degreeV);




    const nurbsSurface = new NURBSSurface(degreeU, degreeV, knotsU, knotsV, controlPoints);

    // --- نمونه‌گیری سطح برای هندسه ---
    const resU = 40;
    const resV = 10;
    const positions = [];
    const uvs = [];

    const tempVec = new Vector3();
    for (let i=0; i<=resU; i++){
        const u = i / resU;
        for (let j=0; j<=resV; j++){
            const v = j / resV;
            nurbsSurface.getPoint(u,v,tempVec); // پر کردن tempVec
            positions.push(tempVec.x, tempVec.y, tempVec.z);
            uvs.push(v, u); // UV ساده
        }
    }

    // هندسه
    const geometry = new BufferGeometry();
    geometry.setAttribute('position', new Float32BufferAttribute(positions,3));
    geometry.setAttribute('uv', new Float32BufferAttribute(uvs,2));

    const indices = [];
    for (let i=0; i<resU; i++){
        for (let j=0; j<resV; j++){
            const a = i*(resV+1)+j;
            const b = (i+1)*(resV+1)+j;
            const c = (i+1)*(resV+1)+j+1;
            const d = i*(resV+1)+j+1;
            indices.push(a,b,d);
            indices.push(b,c,d);
        }
    }
    geometry.setIndex(indices);
    geometry.computeVertexNormals();



    const mesh = new Mesh(geometry, mat);
    return { mesh, nurbsSurface, geometry };
}

/**
* ساخت یک NURBS Mesh روی صورت با تکسچر uv-checker
* @param {Array} landmarks - خروجی Mediapipe
* @param {MeshBasicMaterial} mat
* @param {Number} renderWidth - عرض تصویر ویدیو
* @param {Number} renderHeight - ارتفاع تصویر ویدیو
* @returns {Object} { mesh, nurbsSurface, geometry }
*/
export function createLeftEyeNurbsMesh(landmarks, mat, renderWidth, renderHeight) {
    if (!landmarks) return null;
    const controlPoints = [
        [
            landmarkToWorld(landmarks[35], renderWidth, renderHeight),
            landmarkToWorld(landmarks[226], renderWidth, renderHeight),
            landmarkToWorld(landmarks[130], renderWidth, renderHeight),
            landmarkToWorld(landmarks[33], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[124], renderWidth, renderHeight),
            landmarkToWorld(landmarks[113], renderWidth, renderHeight),
            landmarkToWorld(landmarks[247], renderWidth, renderHeight),
            landmarkToWorld(landmarks[246], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[46], renderWidth, renderHeight),
            landmarkToWorld(landmarks[225], renderWidth, renderHeight),
            landmarkToWorld(landmarks[30], renderWidth, renderHeight),
            landmarkToWorld(landmarks[161], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[53], renderWidth, renderHeight),
            landmarkToWorld(landmarks[224], renderWidth, renderHeight),
            landmarkToWorld(landmarks[29], renderWidth, renderHeight),
            landmarkToWorld(landmarks[160], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[52], renderWidth, renderHeight),
            landmarkToWorld(landmarks[223], renderWidth, renderHeight),
            landmarkToWorld(landmarks[27], renderWidth, renderHeight),
            landmarkToWorld(landmarks[159], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[65], renderWidth, renderHeight),
            landmarkToWorld(landmarks[222], renderWidth, renderHeight),
            landmarkToWorld(landmarks[28], renderWidth, renderHeight),
            landmarkToWorld(landmarks[158], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[55], renderWidth, renderHeight),
            landmarkToWorld(landmarks[221], renderWidth, renderHeight),
            landmarkToWorld(landmarks[56], renderWidth, renderHeight),
            landmarkToWorld(landmarks[157], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[193], renderWidth, renderHeight),
            landmarkToWorld(landmarks[189], renderWidth, renderHeight),
            landmarkToWorld(landmarks[190], renderWidth, renderHeight),
            landmarkToWorld(landmarks[173], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[245], renderWidth, renderHeight),
            landmarkToWorld(landmarks[244], renderWidth, renderHeight),
            landmarkToWorld(landmarks[243], renderWidth, renderHeight),
            landmarkToWorld(landmarks[133], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[128], renderWidth, renderHeight),
            landmarkToWorld(landmarks[233], renderWidth, renderHeight),
            landmarkToWorld(landmarks[112], renderWidth, renderHeight),
            landmarkToWorld(landmarks[155], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[121], renderWidth, renderHeight),
            landmarkToWorld(landmarks[232], renderWidth, renderHeight),
            landmarkToWorld(landmarks[26], renderWidth, renderHeight),
            landmarkToWorld(landmarks[154], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[120], renderWidth, renderHeight),
            landmarkToWorld(landmarks[231], renderWidth, renderHeight),
            landmarkToWorld(landmarks[22], renderWidth, renderHeight),
            landmarkToWorld(landmarks[153], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[119], renderWidth, renderHeight),
            landmarkToWorld(landmarks[230], renderWidth, renderHeight),
            landmarkToWorld(landmarks[23], renderWidth, renderHeight),
            landmarkToWorld(landmarks[145], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[118], renderWidth, renderHeight),
            landmarkToWorld(landmarks[229], renderWidth, renderHeight),
            landmarkToWorld(landmarks[24], renderWidth, renderHeight),
            landmarkToWorld(landmarks[144], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[117], renderWidth, renderHeight),
            landmarkToWorld(landmarks[228], renderWidth, renderHeight),
            landmarkToWorld(landmarks[110], renderWidth, renderHeight),
            landmarkToWorld(landmarks[163], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[111], renderWidth, renderHeight),
            landmarkToWorld(landmarks[31], renderWidth, renderHeight),
            landmarkToWorld(landmarks[25], renderWidth, renderHeight),
            landmarkToWorld(landmarks[7], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[35], renderWidth, renderHeight),
            landmarkToWorld(landmarks[226], renderWidth, renderHeight),
            landmarkToWorld(landmarks[130], renderWidth, renderHeight),
            landmarkToWorld(landmarks[33], renderWidth, renderHeight),
        ],
    ];
    return faceNurbsModelController(controlPoints,mat);
}

/**
 * ساخت یک NURBS Mesh روی صورت با تکسچر uv-checker
 * @param {Array} landmarks - خروجی Mediapipe
 * @param {MeshBasicMaterial} mat
 * @param {Number} renderWidth - عرض تصویر ویدیو
 * @param {Number} renderHeight - ارتفاع تصویر ویدیو
 * @returns {Object} { mesh, nurbsSurface, geometry }
 */
export function createRightEyeNurbsMesh(landmarks, mat, renderWidth, renderHeight) {
    if (!landmarks) return null;
    const controlPoints = [
        [
            landmarkToWorld(landmarks[265], renderWidth, renderHeight),
            landmarkToWorld(landmarks[446], renderWidth, renderHeight),
            landmarkToWorld(landmarks[359], renderWidth, renderHeight),
            landmarkToWorld(landmarks[263], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[353], renderWidth, renderHeight),
            landmarkToWorld(landmarks[342], renderWidth, renderHeight),
            landmarkToWorld(landmarks[467], renderWidth, renderHeight),
            landmarkToWorld(landmarks[466], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[276], renderWidth, renderHeight),
            landmarkToWorld(landmarks[445], renderWidth, renderHeight),
            landmarkToWorld(landmarks[260], renderWidth, renderHeight),
            landmarkToWorld(landmarks[388], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[283], renderWidth, renderHeight),
            landmarkToWorld(landmarks[444], renderWidth, renderHeight),
            landmarkToWorld(landmarks[259], renderWidth, renderHeight),
            landmarkToWorld(landmarks[387], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[282], renderWidth, renderHeight),
            landmarkToWorld(landmarks[443], renderWidth, renderHeight),
            landmarkToWorld(landmarks[257], renderWidth, renderHeight),
            landmarkToWorld(landmarks[386], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[295], renderWidth, renderHeight),
            landmarkToWorld(landmarks[442], renderWidth, renderHeight),
            landmarkToWorld(landmarks[258], renderWidth, renderHeight),
            landmarkToWorld(landmarks[385], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[285], renderWidth, renderHeight),
            landmarkToWorld(landmarks[441], renderWidth, renderHeight),
            landmarkToWorld(landmarks[286], renderWidth, renderHeight),
            landmarkToWorld(landmarks[384], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[417], renderWidth, renderHeight),
            landmarkToWorld(landmarks[413], renderWidth, renderHeight),
            landmarkToWorld(landmarks[414], renderWidth, renderHeight),
            landmarkToWorld(landmarks[398], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[465], renderWidth, renderHeight),
            landmarkToWorld(landmarks[464], renderWidth, renderHeight),
            landmarkToWorld(landmarks[463], renderWidth, renderHeight),
            landmarkToWorld(landmarks[362], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[357], renderWidth, renderHeight),
            landmarkToWorld(landmarks[453], renderWidth, renderHeight),
            landmarkToWorld(landmarks[341], renderWidth, renderHeight),
            landmarkToWorld(landmarks[382], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[350], renderWidth, renderHeight),
            landmarkToWorld(landmarks[452], renderWidth, renderHeight),
            landmarkToWorld(landmarks[256], renderWidth, renderHeight),
            landmarkToWorld(landmarks[381], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[349], renderWidth, renderHeight),
            landmarkToWorld(landmarks[451], renderWidth, renderHeight),
            landmarkToWorld(landmarks[252], renderWidth, renderHeight),
            landmarkToWorld(landmarks[380], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[348], renderWidth, renderHeight),
            landmarkToWorld(landmarks[450], renderWidth, renderHeight),
            landmarkToWorld(landmarks[253], renderWidth, renderHeight),
            landmarkToWorld(landmarks[374], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[347], renderWidth, renderHeight),
            landmarkToWorld(landmarks[449], renderWidth, renderHeight),
            landmarkToWorld(landmarks[254], renderWidth, renderHeight),
            landmarkToWorld(landmarks[373], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[346], renderWidth, renderHeight),
            landmarkToWorld(landmarks[448], renderWidth, renderHeight),
            landmarkToWorld(landmarks[339], renderWidth, renderHeight),
            landmarkToWorld(landmarks[390], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[340], renderWidth, renderHeight),
            landmarkToWorld(landmarks[261], renderWidth, renderHeight),
            landmarkToWorld(landmarks[255], renderWidth, renderHeight),
            landmarkToWorld(landmarks[249], renderWidth, renderHeight),
        ],
        [
            landmarkToWorld(landmarks[265], renderWidth, renderHeight),
            landmarkToWorld(landmarks[446], renderWidth, renderHeight),
            landmarkToWorld(landmarks[359], renderWidth, renderHeight),
            landmarkToWorld(landmarks[263], renderWidth, renderHeight),
        ],
    ];

    return faceNurbsModelController(controlPoints,mat);
}

export function updateFaceNurbsMesh(landmarks, nurbsData, renderWidth, renderHeight,isLeftEye) {
    if(!nurbsData)
        return;
    const { nurbsSurface, geometry } = nurbsData;
    if (!landmarks) return;

    const landmarkToWorld = (l, W, H, depthScale = 200) => {
        if (!l) return new Vector3(0, 0, 0);
        return new Vector3(
            (l.x - 0.5) * W,
            -(l.y - 0.5) * H,
            -(l.z - 0.5) * depthScale
        );
    };

    // همان آرایه‌ی controlPoints در createFaceNurbsMesh
    const leftEyeArray = [
        [ landmarks[35], landmarks[226], landmarks[130], landmarks[33] ],
        [ landmarks[124], landmarks[113], landmarks[247], landmarks[246] ],
        [ landmarks[46], landmarks[225], landmarks[30], landmarks[161] ],
        [ landmarks[53], landmarks[224], landmarks[29], landmarks[160] ],
        [ landmarks[52], landmarks[223], landmarks[27], landmarks[159] ],
        [ landmarks[65], landmarks[222], landmarks[28], landmarks[158] ],
        [ landmarks[55], landmarks[221], landmarks[56], landmarks[157] ],
        [ landmarks[193], landmarks[189], landmarks[190], landmarks[173] ],
        [ landmarks[245], landmarks[244], landmarks[243], landmarks[133] ],
        [ landmarks[128], landmarks[233], landmarks[112], landmarks[155] ],
        [ landmarks[121], landmarks[232], landmarks[26], landmarks[154] ],
        [ landmarks[120], landmarks[231], landmarks[22], landmarks[153] ],
        [ landmarks[119], landmarks[230], landmarks[23], landmarks[145] ],
        [ landmarks[118], landmarks[229], landmarks[24], landmarks[144] ],
        [ landmarks[117], landmarks[228], landmarks[110], landmarks[163] ],
        [ landmarks[111], landmarks[31], landmarks[25], landmarks[7] ],
        [ landmarks[35], landmarks[226], landmarks[130], landmarks[33] ]
    ];
    const rightEyeArray = [
        [ landmarks[265], landmarks[446], landmarks[359], landmarks[263] ],
        [ landmarks[353], landmarks[342], landmarks[467], landmarks[466] ],
        [ landmarks[276], landmarks[445], landmarks[260], landmarks[388] ],
        [ landmarks[283], landmarks[444], landmarks[259], landmarks[387] ],
        [ landmarks[282], landmarks[443], landmarks[257], landmarks[386] ],
        [ landmarks[295], landmarks[442], landmarks[258], landmarks[385] ],
        [ landmarks[285], landmarks[441], landmarks[286], landmarks[384] ],
        [ landmarks[417], landmarks[413], landmarks[414], landmarks[398] ],
        [ landmarks[465], landmarks[464], landmarks[463], landmarks[362] ],
        [ landmarks[357], landmarks[453], landmarks[341], landmarks[382] ],
        [ landmarks[350], landmarks[452], landmarks[256], landmarks[381] ],
        [ landmarks[349], landmarks[451], landmarks[252], landmarks[380] ],
        [ landmarks[348], landmarks[450], landmarks[253], landmarks[374] ],
        [ landmarks[347], landmarks[449], landmarks[254], landmarks[373] ],
        [ landmarks[346], landmarks[448], landmarks[339], landmarks[390] ],
        [ landmarks[340], landmarks[261], landmarks[255], landmarks[249] ],
        [ landmarks[265], landmarks[446], landmarks[359], landmarks[263] ]
    ];
    let newControlPoints = [];
    if(isLeftEye)
        newControlPoints = leftEyeArray
    else
        newControlPoints = rightEyeArray

    // جایگزینی مقادیر جدید در nurbsSurface.controlPoints
    for (let i = 0; i < nurbsSurface.controlPoints.length; i++) {
        for (let j = 0; j < nurbsSurface.controlPoints[i].length; j++) {
            nurbsSurface.controlPoints[i][j].copy(
                landmarkToWorld(newControlPoints[i][j], renderWidth, renderHeight)
            );
        }
    }

    // آپدیت هندسه (mesh sampling دوباره)
    const resU = 40;
    const resV = 10;
    const tempVec = new Vector3();
    const posAttr = geometry.attributes.position;
    let idx = 0;

    for (let i = 0; i <= resU; i++) {
        const u = i / resU;
        for (let j = 0; j <= resV; j++) {
            const v = j / resV;
            nurbsSurface.getPoint(u, v, tempVec);
            posAttr.array[idx++] = tempVec.x;
            posAttr.array[idx++] = tempVec.y;
            posAttr.array[idx++] = tempVec.z;
        }
    }

    posAttr.needsUpdate = true;
    geometry.computeVertexNormals();
}
