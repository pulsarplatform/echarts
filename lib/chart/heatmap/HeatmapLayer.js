
/*
* Licensed to the Apache Software Foundation (ASF) under one
* or more contributor license agreements.  See the NOTICE file
* distributed with this work for additional information
* regarding copyright ownership.  The ASF licenses this file
* to you under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance
* with the License.  You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing,
* software distributed under the License is distributed on an
* "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
* KIND, either express or implied.  See the License for the
* specific language governing permissions and limitations
* under the License.
*/


/**
 * AUTO-GENERATED FILE. DO NOT MODIFY.
 */

/*
* Licensed to the Apache Software Foundation (ASF) under one
* or more contributor license agreements.  See the NOTICE file
* distributed with this work for additional information
* regarding copyright ownership.  The ASF licenses this file
* to you under the Apache License, Version 2.0 (the
* "License"); you may not use this file except in compliance
* with the License.  You may obtain a copy of the License at
*
*   http://www.apache.org/licenses/LICENSE-2.0
*
* Unless required by applicable law or agreed to in writing,
* software distributed under the License is distributed on an
* "AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
* KIND, either express or implied.  See the License for the
* specific language governing permissions and limitations
* under the License.
*/
/* global Uint8ClampedArray */
import { platformApi } from 'zrender/lib/core/platform.js';
const GRADIENT_LEVELS = 256;
class HeatmapLayer {
  constructor() {
    this.blurSize = 30;
    this.pointSize = 20;
    this.maxOpacity = 1;
    this.minOpacity = 0;
    this._gradientPixels = {
      inRange: null,
      outOfRange: null
    };
    const canvas = platformApi.createCanvas();
    this.canvas = canvas;
  }
  /**
   * Renders Heatmap and returns the rendered canvas
   * @param data array of data, each has x, y, value
   * @param width canvas width
   * @param height canvas height
   */
  update(data, width, height, normalize, colorFunc, isInRange) {
    const brush = this._getBrush();
    const gradientInRange = this._getGradient(colorFunc, 'inRange');
    const gradientOutOfRange = this._getGradient(colorFunc, 'outOfRange');
    const r = this.pointSize + this.blurSize;
    const canvas = this.canvas;
    const ctx = canvas.getContext('2d');
    const len = data.length;
    canvas.width = width;
    canvas.height = height;
    for (let i = 0; i < len; ++i) {
      const p = data[i];
      const x = p[0];
      const y = p[1];
      const value = p[2];
      // calculate alpha using value
      const alpha = normalize(value);
      // draw with the circle brush with alpha
      ctx.globalAlpha = alpha;
      ctx.drawImage(brush, x - r, y - r);
    }
    if (!canvas.width || !canvas.height) {
      // Avoid "Uncaught DOMException: Failed to execute 'getImageData' on
      // 'CanvasRenderingContext2D': The source height is 0."
      return canvas;
    }
    // colorize the canvas using alpha value and set with gradient
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    let offset = 0;
    const pixelLen = pixels.length;
    const minOpacity = this.minOpacity;
    const maxOpacity = this.maxOpacity;
    const diffOpacity = maxOpacity - minOpacity;
    while (offset < pixelLen) {
      let alpha = pixels[offset + 3] / 256;
      const gradientOffset = Math.floor(alpha * (GRADIENT_LEVELS - 1)) * 4;
      // Simple optimize to ignore the empty data
      if (alpha > 0) {
        const gradient = isInRange(alpha) ? gradientInRange : gradientOutOfRange;
        // Any alpha > 0 will be mapped to [minOpacity, maxOpacity]
        alpha > 0 && (alpha = alpha * diffOpacity + minOpacity);
        pixels[offset++] = gradient[gradientOffset];
        pixels[offset++] = gradient[gradientOffset + 1];
        pixels[offset++] = gradient[gradientOffset + 2];
        pixels[offset++] = gradient[gradientOffset + 3] * alpha * 256;
      } else {
        offset += 4;
      }
    }
    ctx.putImageData(imageData, 0, 0);
    return canvas;
  }
  /**
   * get canvas of a black circle brush used for canvas to draw later
   */
  _getBrush() {
    const brushCanvas = this._brushCanvas || (this._brushCanvas = platformApi.createCanvas());
    // set brush size
    const r = this.pointSize + this.blurSize;
    const d = r * 2;
    brushCanvas.width = d;
    brushCanvas.height = d;
    const ctx = brushCanvas.getContext('2d');
    ctx.clearRect(0, 0, d, d);
    // in order to render shadow without the distinct circle,
    // draw the distinct circle in an invisible place,
    // and use shadowOffset to draw shadow in the center of the canvas
    ctx.shadowOffsetX = d;
    ctx.shadowBlur = this.blurSize;
    // draw the shadow in black, and use alpha and shadow blur to generate
    // color in color map
    ctx.shadowColor = '#000';
    // draw circle in the left to the canvas
    ctx.beginPath();
    ctx.arc(-r, r, this.pointSize, 0, Math.PI * 2, true);
    ctx.closePath();
    ctx.fill();
    return brushCanvas;
  }
  /**
   * get gradient color map
   * @private
   */
  _getGradient(colorFunc, state) {
    const gradientPixels = this._gradientPixels;
    const pixelsSingleState = gradientPixels[state] || (gradientPixels[state] = new Uint8ClampedArray(256 * 4));
    const color = [0, 0, 0, 0];
    let off = 0;
    for (let i = 0; i < 256; i++) {
      colorFunc[state](i / 255, true, color);
      pixelsSingleState[off++] = color[0];
      pixelsSingleState[off++] = color[1];
      pixelsSingleState[off++] = color[2];
      pixelsSingleState[off++] = color[3];
    }
    return pixelsSingleState;
  }
}
export default HeatmapLayer;