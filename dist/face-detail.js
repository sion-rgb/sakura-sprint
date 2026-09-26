// Local colour repair for the selected model's grey nose mark.
// The existing surface, UVs, original images, eyelids and nose silhouette stay intact.
export const noseRepair = Object.freeze({
  center: [-0.0075, 1.389, 0.2167],
  radius: [0.0075, 0.010, 0.023],
  cheekUV: [[0.66893845, 0.81143933], [0.90440997, 0.88767972]],
});

export function applyFaceDetail(body) {
  if (!body?.isSkinnedMesh || body.name !== 'Yui_Selected_Original_Surface') {
    throw new Error('Face detail requires the preserved selected surface');
  }
  const material = body.material.clone();
  body.material = material;
  material.customProgramCacheKey = () => 'yui-local-nose-colour-v1';
  material.onBeforeCompile = shader => {
    for (const [source, token] of [
      [shader.vertexShader, '#include <begin_vertex>'],
      [shader.fragmentShader, '#include <map_fragment>'],
    ]) {
      if (!source.includes(token)) throw new Error(`Unsupported character shader: ${token}`);
    }
    shader.vertexShader = 'varying vec3 vYuiRestPosition;\n' + shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace('#include <begin_vertex>',
      '#include <begin_vertex>\nvYuiRestPosition = position;');
    shader.fragmentShader = 'varying vec3 vYuiRestPosition;\n' + shader.fragmentShader;
    // Sample the two adjacent cheek pixels in the unchanged source map. This is
    // linear colour at shader time; no new skin texture or camera projection.
    shader.fragmentShader = shader.fragmentShader.replace('#include <map_fragment>', `
      #include <map_fragment>
      #ifdef USE_MAP
        vec3 noseDelta = (vYuiRestPosition - vec3(${noseRepair.center.join(',')}))
                       / vec3(${noseRepair.radius.join(',')});
        float noseMask = 1.0 - smoothstep(0.55, 1.0, length(noseDelta));
        vec3 leftSkin = texture2D(map, vec2(${noseRepair.cheekUV[0].join(',')})).rgb;
        vec3 rightSkin = texture2D(map, vec2(${noseRepair.cheekUV[1].join(',')})).rgb;
        vec3 localSkin = mix(leftSkin, rightSkin, smoothstep(-0.015, 0.0, vYuiRestPosition.x));
        diffuseColor.rgb = mix(diffuseColor.rgb, localSkin * diffuse, noseMask);
      #endif
    `);
  };
  return 'local nose colour / original cheek samples / fixed rest-space mask';
}
