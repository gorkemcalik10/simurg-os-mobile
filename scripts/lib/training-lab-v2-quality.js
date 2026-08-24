const zlib = require('node:zlib');

function paeth(a, b, c) {
  const p = a + b - c;
  const pa = Math.abs(p - a), pb = Math.abs(p - b), pc = Math.abs(p - c);
  return pa <= pb && pa <= pc ? a : pb <= pc ? b : c;
}

function decodePngAlpha(bytes) {
  if (!Buffer.isBuffer(bytes) || bytes.length < 33 || bytes.subarray(0, 8).toString('hex') !== '89504e470d0a1a0a') {
    throw new Error('invalid_png');
  }
  let width, height, bitDepth, colorType, interlace;
  const idat = [];
  for (let offset = 8; offset + 12 <= bytes.length;) {
    const length = bytes.readUInt32BE(offset);
    const type = bytes.toString('ascii', offset + 4, offset + 8);
    const data = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === 'IHDR') {
      width = data.readUInt32BE(0); height = data.readUInt32BE(4);
      bitDepth = data[8]; colorType = data[9]; interlace = data[12];
    } else if (type === 'IDAT') idat.push(data);
    else if (type === 'IEND') break;
    offset += length + 12;
  }
  const channels = {0:1, 2:3, 4:2, 6:4}[colorType];
  if (!width || !height || bitDepth !== 8 || !channels || interlace !== 0) throw new Error('unsupported_png_contract');
  const stride = width * channels;
  const raw = zlib.inflateSync(Buffer.concat(idat));
  if (raw.length !== (stride + 1) * height) throw new Error('invalid_png_scanlines');
  const pixels = Buffer.alloc(stride * height);
  for (let y = 0, input = 0; y < height; y += 1) {
    const filter = raw[input++];
    const row = y * stride;
    for (let x = 0; x < stride; x += 1) {
      const value = raw[input++];
      const left = x >= channels ? pixels[row + x - channels] : 0;
      const up = y ? pixels[row - stride + x] : 0;
      const upLeft = y && x >= channels ? pixels[row - stride + x - channels] : 0;
      if (filter === 0) pixels[row + x] = value;
      else if (filter === 1) pixels[row + x] = (value + left) & 255;
      else if (filter === 2) pixels[row + x] = (value + up) & 255;
      else if (filter === 3) pixels[row + x] = (value + Math.floor((left + up) / 2)) & 255;
      else if (filter === 4) pixels[row + x] = (value + paeth(left, up, upLeft)) & 255;
      else throw new Error('unsupported_png_filter');
    }
  }
  const alpha = new Uint8Array(width * height);
  const alphaOffset = colorType === 6 ? 3 : colorType === 4 ? 1 : -1;
  for (let i = 0; i < alpha.length; i += 1) alpha[i] = alphaOffset < 0 ? 255 : pixels[i * channels + alphaOffset];
  return {width, height, bitDepth, colorType, channels, hasAlpha:alphaOffset >= 0, pixels, alpha};
}

function atlasViewStats(image, bounds, threshold = 0) {
  if (!image || !image.pixels || !image.alpha || !image.channels) throw new Error('missing_png_pixels');
  let visiblePixels = 0, minRgb = 255, maxRgb = 0;
  const colors = new Set();
  const sampleStride = Math.max(1, Math.floor((bounds.width * bounds.height) / 4096));
  let sampleIndex = 0;
  for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
      const pixelIndex = y * image.width + x;
      if (image.alpha[pixelIndex] <= threshold) continue;
      visiblePixels += 1;
      const offset = pixelIndex * image.channels;
      const rgb = image.colorType === 0 || image.colorType === 4
        ? [image.pixels[offset], image.pixels[offset], image.pixels[offset]]
        : [image.pixels[offset], image.pixels[offset + 1], image.pixels[offset + 2]];
      minRgb = Math.min(minRgb, rgb[0], rgb[1], rgb[2]);
      maxRgb = Math.max(maxRgb, rgb[0], rgb[1], rgb[2]);
      if (sampleIndex++ % sampleStride === 0 && colors.size < 4096) colors.add(rgb.join(','));
    }
  }
  const totalPixels = bounds.width * bounds.height;
  return {
    visiblePixels,
    visibleCoverage: totalPixels ? visiblePixels / totalPixels : 0,
    rgbDynamicRange: visiblePixels ? maxRgb - minRgb : 0,
    sampledColorCount: colors.size
  };
}

function boundsOf(alpha, width, threshold) {
  let minX = width, minY = Math.ceil(alpha.length / width), maxX = -1, maxY = -1, active = 0;
  for (let i = 0; i < alpha.length; i += 1) if (alpha[i] > threshold) {
    const x = i % width, y = Math.floor(i / width);
    active += 1; minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
  }
  return active ? {x:minX, y:minY, width:maxX-minX+1, height:maxY-minY+1, activePixels:active} : null;
}

function alphaCoverageInBounds(alpha, width, bounds, threshold = 0) {
  let activePixels = 0;
  for (let y = bounds.y; y < bounds.y + bounds.height; y += 1) {
    for (let x = bounds.x; x < bounds.x + bounds.width; x += 1) {
      if (alpha[y * width + x] > threshold) activePixels += 1;
    }
  }
  return activePixels / (bounds.width * bounds.height);
}

function direction(edge) {
  return [edge[2] - edge[0], edge[3] - edge[1]];
}

function turnRank(previous, candidate) {
  const a = direction(previous), b = direction(candidate);
  const cross = a[0] * b[1] - a[1] * b[0];
  const dot = a[0] * b[0] + a[1] * b[1];
  if (cross > 0) return 0;
  if (dot > 0) return 1;
  if (cross < 0) return 2;
  return 3;
}

function simplifyOrthogonal(points) {
  if (points.length < 4) return points;
  const simplified = [];
  for (let i = 0; i < points.length; i += 1) {
    const previous = points[(i + points.length - 1) % points.length];
    const current = points[i];
    const next = points[(i + 1) % points.length];
    const sameX = previous[0] === current[0] && current[0] === next[0];
    const sameY = previous[1] === current[1] && current[1] === next[1];
    if (!sameX && !sameY) simplified.push(current);
  }
  return simplified;
}

function contoursFromAlpha(alpha, width, height, threshold = 0) {
  if (!(alpha instanceof Uint8Array) || alpha.length !== width * height) throw new Error('invalid_alpha_canvas');
  const edges = [];
  const active = (x, y) => x >= 0 && y >= 0 && x < width && y < height && alpha[y * width + x] > threshold;
  for (let y = 0; y < height; y += 1) for (let x = 0; x < width; x += 1) if (active(x, y)) {
    if (!active(x, y - 1)) edges.push([x, y, x + 1, y]);
    if (!active(x + 1, y)) edges.push([x + 1, y, x + 1, y + 1]);
    if (!active(x, y + 1)) edges.push([x + 1, y + 1, x, y + 1]);
    if (!active(x - 1, y)) edges.push([x, y + 1, x, y]);
  }
  const starts = new Map();
  edges.forEach((edge, index) => {
    const key = edge[0] + ',' + edge[1];
    if (!starts.has(key)) starts.set(key, []);
    starts.get(key).push(index);
  });
  const used = new Uint8Array(edges.length), contours = [];
  for (let seed = 0; seed < edges.length; seed += 1) {
    if (used[seed]) continue;
    let index = seed, edge = edges[index];
    const origin = [edge[0], edge[1]], points = [origin];
    while (!used[index]) {
      used[index] = 1;
      edge = edges[index];
      points.push([edge[2], edge[3]]);
      if (edge[2] === origin[0] && edge[3] === origin[1]) break;
      const candidates = (starts.get(edge[2] + ',' + edge[3]) || []).filter(candidate => !used[candidate]);
      if (!candidates.length) throw new Error('open_alpha_contour');
      candidates.sort((a, b) => turnRank(edge, edges[a]) - turnRank(edge, edges[b]) || a - b);
      index = candidates[0];
    }
    if (points.length >= 4 && points[points.length - 1][0] === origin[0] && points[points.length - 1][1] === origin[1]) {
      points.pop();
      const simplified = simplifyOrthogonal(points);
      if (simplified.length >= 3) contours.push(simplified);
    }
  }
  return contours;
}

function svgPathFromContours(contours) {
  return contours.map(points => 'M' + points.map(point => point[0] + ' ' + point[1]).join(' L') + ' Z').join(' ');
}

function createContourDocument({regionId, alpha, width, height, threshold = 0}) {
  const bounds = boundsOf(alpha, width, threshold);
  if (!bounds) throw new Error('empty_mask_alpha');
  const contours = contoursFromAlpha(alpha, width, height, threshold);
  if (!contours.length) throw new Error('empty_mask_contour');
  return {
    schemaVersion: 1,
    regionId,
    coordinateSpace: 'combined-atlas-pixels',
    fillRule: 'evenodd',
    canvas: {width, height},
    alphaThreshold: threshold,
    bounds: {x:bounds.x, y:bounds.y, width:bounds.width, height:bounds.height},
    svgPath: svgPathFromContours(contours),
    contourCount: contours.length,
    pointCount: contours.reduce((total, points) => total + points.length, 0)
  };
}

function sameBounds(actual, expected, tolerance) {
  return ['x','y','width','height'].every(key => Math.abs(actual[key] - expected[key]) <= tolerance);
}

function validateMaskQuality({manifest, region, mask, base}) {
  const quality = {...manifest.quality};
  const errors = [];
  const canvas = manifest.canvas;
  const view = manifest.views[region.view];
  if (mask.width !== canvas.width || mask.height !== canvas.height) errors.push({code:'asset_dimension_mismatch', regionId:region.regionId});
  if (!mask.hasAlpha) errors.push({code:'invalid_mask_alpha', regionId:region.regionId});
  if (errors.length) return {regionId:region.regionId, errors};
  const bounds = boundsOf(mask.alpha, mask.width, quality.alphaThreshold);
  if (!bounds) return {regionId:region.regionId, errors:[{code:'empty_mask_alpha', regionId:region.regionId}]};
  const coverage = bounds.activePixels / mask.alpha.length;
  if (coverage < quality.minAlphaCoverage || coverage > quality.maxAlphaCoverage) errors.push({code:'alpha_coverage_out_of_range', regionId:region.regionId, coverage});
  const right = bounds.x + bounds.width, bottom = bounds.y + bounds.height;
  if (bounds.x < view.x || bounds.y < view.y || right > view.x + view.width || bottom > view.y + view.height) errors.push({code:'region_boundary_violation', regionId:region.regionId, bounds, view});
  if (region.bounds && !sameBounds(bounds, region.bounds, quality.boundsTolerance)) errors.push({code:'region_bounds_mismatch', regionId:region.regionId, expected:region.bounds, actual:bounds});
  let overlap = 0;
  for (let i = 0; i < mask.alpha.length; i += 1) if (mask.alpha[i] > quality.alphaThreshold && base.alpha[i] > quality.alphaThreshold) overlap += 1;
  const baseOverlap = overlap / bounds.activePixels;
  if (baseOverlap < quality.minBaseOverlap) errors.push({code:'mask_base_alignment_mismatch', regionId:region.regionId, baseOverlap});
  return {regionId:region.regionId, coverage, baseOverlap, bounds, errors};
}

module.exports = {
  decodePngAlpha,
  boundsOf,
  alphaCoverageInBounds,
  contoursFromAlpha,
  svgPathFromContours,
  createContourDocument,
  atlasViewStats,
  validateMaskQuality
};
