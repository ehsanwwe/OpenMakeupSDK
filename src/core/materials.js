import {
    ClampToEdgeWrapping,
    GLSL3,
    DoubleSide,
    FrontSide,
    Vector4,
    Vector3,
    Color,
    ShaderMaterial,
    RepeatWrapping,
    RGBAFormat,
    LinearFilter,
} from 'three';
import { RawShaderMaterial, TextureLoader } from 'three';

const texLoader = new TextureLoader();

export async function loadShaderSource(url) {
    const response = await fetch(url);
    return await response.text();
}

export async function loadBlurMat(assets, refractUniforms) {
    const vertexShaderSource = await loadShaderSource(assets.shader('bluremask', 'vertex.glsl') + '?a1');
    const fragmentShaderSource = await loadShaderSource(assets.shader('bluremask', 'fragment.glsl') + '?a2');

    const faceMask = texLoader.load(assets.shaderRoot('foundation_mask3.PNG'));
    faceMask.wrapS = ClampToEdgeWrapping;
    faceMask.wrapT = ClampToEdgeWrapping;
    faceMask.flipY = false;

    return new ShaderMaterial({
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        uniforms: {
            ...refractUniforms,
            tMask: { value: faceMask },
        },
        tMask: faceMask,
        transparent: true,
    });
}

export async function loadLipMats(assets) {
    const vertexShaderSource = await loadShaderSource(assets.shader('lip', 'vertex.glsl'));
    const fragmentShaderSource = await loadShaderSource(assets.shader('lip', 'fragment.glsl') + '?aa');

    const lipOpenTexture = texLoader.load(assets.shader('lip', 'Lips-open.PNG'));
    lipOpenTexture.wrapS = ClampToEdgeWrapping;
    lipOpenTexture.wrapT = ClampToEdgeWrapping;
    lipOpenTexture.minFilter = LinearFilter;
    lipOpenTexture.magFilter = LinearFilter;
    lipOpenTexture.generateMipmaps = false;
    lipOpenTexture.needsUpdate = true;
    lipOpenTexture.flipY = false;

    const lipCloseTexture = texLoader.load(assets.shader('lip', 'Lips-close.PNG'));
    lipCloseTexture.wrapS = ClampToEdgeWrapping;
    lipCloseTexture.wrapT = ClampToEdgeWrapping;
    lipCloseTexture.minFilter = LinearFilter;
    lipCloseTexture.magFilter = LinearFilter;
    lipCloseTexture.generateMipmaps = false;
    lipCloseTexture.needsUpdate = true;
    lipCloseTexture.flipY = false;

    const lipGlossy = texLoader.load(assets.shader('lip', 'lip-gloss.PNG'));
    lipGlossy.wrapS = ClampToEdgeWrapping;
    lipGlossy.wrapT = ClampToEdgeWrapping;
    lipGlossy.minFilter = LinearFilter;
    lipGlossy.magFilter = LinearFilter;
    lipGlossy.generateMipmaps = false;
    lipGlossy.needsUpdate = true;
    lipGlossy.flipY = false;

    const uniforms = {
        // Floats
        _BumpScale:            { value: 1.0 },
        _ChromaticAberration:  { value: 0.1 },
        _Cutoff:               { value: 0.5 },
        _Float0:               { value: 2.84 },
        _Float1:               { value: 0.21 },
        _Float2:               { value: -0.02 },
        _Glossiness:           { value: 0.5 },
        _GredientSharpness:    { value: 2.6 },
        _InvFade:              { value: 1.97 },
        _Shininess:            { value: 0.1 },
        _gradientSize:         { value: 2.6 },
        _lipOpen:              { value: 0.7074125 },
        _opacity:              { value: 0.81 },
        _shine:                { value: 0.81 },
        _bright:               { value: 0.0 },

        // Colors (vec4)
        _Color:         { value: new Vector4(1.0, 1.0, 1.0, 1.0) },
        _MainColor:     { value: new Vector4(0.5754717, 0.0, 0.0, 1.0) },
        _SpecularColor: { value: new Vector4(0.3921569, 0.3921569, 0.3921569, 1.0) },
        _TintColor:     { value: new Vector4(0.16037738, 0.16037738, 0.16037738, 0.5) },
        _color:         { value: new Vector4(0.5566038, 0.0, 0.0, 1.0) },

        // ST (scale/offset) for UV transform
        _Texture0_ST:           { value: new Vector4(2.0, 2.0, 0.0, 0.0) },
        _TextureSample1_ST:     { value: new Vector4(1.0, 1.0, 0.0, 0.0) },
        _brightTexture_ST:      { value: new Vector4(12.0, 16.51, 0.0, 0.0) },
        _lip_ST:                { value: new Vector4(1.0, 1.0, 0.0, 0.0) },
        _lipReflection_ST:      { value: new Vector4(1.0, 1.0, 0.0, 0.0) },
        _lipReflectionClose_ST: { value: new Vector4(1.0, 1.0, 0.0, 0.0) },
        _normal_ST:             { value: new Vector4(1.0, 1.0, 0.0, 0.0) },
        _reflec_ST:             { value: new Vector4(1.0, 1.0, 0.0, 0.0) },

        // texture placeholders
        _MainTex:        { value: null },
        _Texture0:       { value: null },
        _lip:            { value: null },
        _TextureSample2: { value: null },
        _normal:         { value: null },
        _reflec:         { value: null },

        // textures
        _brightTexture:      { value: texLoader.load(assets.shader('lip', 'noize.PNG')) },
        _lipReflection:      { value: lipCloseTexture },
        _lipReflectionClose: { value: lipOpenTexture },
        _TextureSample1:     { value: lipGlossy },
    };

    return new RawShaderMaterial({
        glslVersion: GLSL3,
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        uniforms,
        side: DoubleSide,
        depthWrite: false,
        depthTest: true,
        transparent: true,
    });
}

export async function loadEyeShadowMat(assets) {
    const vertexShaderSource = await loadShaderSource(assets.shader('eyeshadow', 'vertex.glsl'));
    const fragmentShaderSource = await loadShaderSource(assets.shader('eyeshadow', 'fragment.glsl'));

    const eyeShadowTexture = texLoader.load(assets.shader('eyeshadow', 'i6333.png'));
    eyeShadowTexture.format = RGBAFormat;
    eyeShadowTexture.minFilter = LinearFilter;
    eyeShadowTexture.magFilter = LinearFilter;
    eyeShadowTexture.generateMipmaps = false;
    eyeShadowTexture.needsUpdate = true;
    eyeShadowTexture.flipY = false;

    const faceMask = texLoader.load(assets.shaderRoot('foundation_mask2.PNG'));
    faceMask.wrapS = ClampToEdgeWrapping;
    faceMask.wrapT = ClampToEdgeWrapping;
    faceMask.minFilter = LinearFilter;
    faceMask.magFilter = LinearFilter;
    faceMask.generateMipmaps = false;
    faceMask.needsUpdate = true;
    faceMask.flipY = false;

    return new RawShaderMaterial({
        glslVersion: GLSL3,
        depthWrite: false,
        depthTest: true,
        transparent: true,
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        uniforms: {
            _ShadowColor: { value: new Vector4(1, 0, 0, 1) },
            _EyeShadowTexture: { value: eyeShadowTexture },
            _FaceMaskE: { value: faceMask },
            _noise: { value: 0.0 },
            _transparency: { value: 1.0 },
        },
    });
}

export async function loadBlushMat(assets) {
    const vertexShaderSource = await loadShaderSource(assets.shader('blush', 'vertex.glsl'));
    const fragmentShaderSource = await loadShaderSource(assets.shader('blush', 'fragment.glsl'));

    const blushTexture = texLoader.load(assets.shader('blush', 'i6417.png'));
    blushTexture.wrapS = ClampToEdgeWrapping;
    blushTexture.wrapT = ClampToEdgeWrapping;
    blushTexture.flipY = false;

    const faceMask = texLoader.load(assets.shaderRoot('foundation_mask.PNG'));
    faceMask.wrapS = ClampToEdgeWrapping;
    faceMask.wrapT = ClampToEdgeWrapping;
    faceMask.flipY = false;

    return new RawShaderMaterial({
        glslVersion: GLSL3,
        side: FrontSide,
        depthWrite: false,
        depthTest: true,
        transparent: true,
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        uniforms: {
            uCameraPosition: { value: new Vector3() },
            _ShadowColor: { value: new Vector4(1, 0.3, 0.4, 1) },
            _EyeShadowTexture: { value: blushTexture },
            _FaceMaskE: { value: faceMask },
            _noise: { value: 0.0 },
            _transparency: { value: 1.0 },
        },
    });
}

export async function loadFoundationMat(assets) {
    const vertexShaderSource = await loadShaderSource(assets.shader('foundation', 'vertex.glsl'));
    const fragmentShaderSource = await loadShaderSource(assets.shader('foundation', 'fragment.glsl'));

    const maskTexture = texLoader.load(assets.shaderRoot('foundation_mask3.PNG'));
    maskTexture.wrapS = ClampToEdgeWrapping;
    maskTexture.wrapT = ClampToEdgeWrapping;
    maskTexture.flipY = false;

    return new RawShaderMaterial({
        glslVersion: GLSL3,
        side: FrontSide,
        depthWrite: true,
        depthTest: true,
        transparent: true,
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        uniforms: {
            uCameraPosition: { value: new Vector3() },
            _MainColor: { value: new Vector4(0.754717, 0.6747463, 0.64435744, 0.0) },
            _Mask: { value: maskTexture },
            _Mask_ST: { value: new Vector4(1.0, 1.0, 0.0, 0.0) },
            _shedat: { value: 0.2 },
        },
    });
}

export async function loadMascaraMat(assets) {
    const texture = texLoader.load(assets.shader('mascara', 'i9144.png'));
    texture.wrapS = ClampToEdgeWrapping;
    texture.wrapT = ClampToEdgeWrapping;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;

    const vertexShaderSource = await loadShaderSource(assets.shader('mascara', 'vertex.glsl'));
    const fragmentShaderSource = await loadShaderSource(assets.shader('mascara', 'fragment.glsl') + '?' + Math.random());

    return new RawShaderMaterial({
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        uniforms: {
            color: { value: new Color(0x000000) },
            map: { value: texture || null },
            useMap: { value: !!texture },
        },
        transparent: true,
        depthTest: true,
        depthWrite: false,
        side: DoubleSide,
    });
}

export async function loadEyeLineMat(assets) {
    const texture = texLoader.load(assets.shader('eyeline', 'i10246.png'));
    texture.wrapS = RepeatWrapping;
    texture.wrapT = RepeatWrapping;
    texture.minFilter = LinearFilter;
    texture.magFilter = LinearFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;

    const vertexShaderSource = await loadShaderSource(assets.shader('eyeline', 'vertex.glsl'));
    const fragmentShaderSource = await loadShaderSource(assets.shader('eyeline', 'fragment.glsl') + '?aaa');

    return new RawShaderMaterial({
        vertexShader: vertexShaderSource,
        fragmentShader: fragmentShaderSource,
        uniforms: {
            color: { value: new Vector4(0, 0, 0, 1) },
            map: { value: texture || null },
        },
        transparent: true,
        depthTest: true,
        depthWrite: false,
        side: DoubleSide,
    });
}
