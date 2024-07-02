
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
import { Path } from '../graphic.js';
/**
 * Sausage: similar to sector, but have half circle on both sides
 */
class SausageShape {
  constructor() {
    this.cx = 0;
    this.cy = 0;
    this.r0 = 0;
    this.r = 0;
    this.startAngle = 0;
    this.endAngle = Math.PI * 2;
    this.clockwise = true;
  }
}
class SausagePath extends Path {
  constructor(opts) {
    super(opts);
    this.type = 'sausage';
  }
  getDefaultShape() {
    return new SausageShape();
  }
  buildPath(ctx, shape) {
    const cx = shape.cx;
    const cy = shape.cy;
    const r0 = Math.max(shape.r0 || 0, 0);
    const r = Math.max(shape.r, 0);
    const dr = (r - r0) * 0.5;
    const rCenter = r0 + dr;
    let startAngle = shape.startAngle;
    const endAngle = shape.endAngle;
    const clockwise = shape.clockwise;
    const PI2 = Math.PI * 2;
    const lessThanCircle = clockwise ? endAngle - startAngle < PI2 : startAngle - endAngle < PI2;
    if (!lessThanCircle) {
      // Normalize angles
      startAngle = endAngle - (clockwise ? PI2 : -PI2);
    }
    const unitStartX = Math.cos(startAngle);
    const unitStartY = Math.sin(startAngle);
    const unitEndX = Math.cos(endAngle);
    const unitEndY = Math.sin(endAngle);
    if (lessThanCircle) {
      ctx.moveTo(unitStartX * r0 + cx, unitStartY * r0 + cy);
      ctx.arc(unitStartX * rCenter + cx, unitStartY * rCenter + cy, dr, -Math.PI + startAngle, startAngle, !clockwise);
    } else {
      ctx.moveTo(unitStartX * r + cx, unitStartY * r + cy);
    }
    ctx.arc(cx, cy, r, startAngle, endAngle, !clockwise);
    ctx.arc(unitEndX * rCenter + cx, unitEndY * rCenter + cy, dr, endAngle - Math.PI * 2, endAngle - Math.PI, !clockwise);
    if (r0 !== 0) {
      ctx.arc(cx, cy, r0, endAngle, startAngle, clockwise);
    }
    // ctx.closePath();
  }
}

export default SausagePath;