
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
import { retrieveRawValue } from '../../data/helper/dataProvider.js';
import { isArray } from 'zrender/lib/core/util.js';
/**
 * @return label string. Not null/undefined
 */
export function getDefaultLabel(data, dataIndex) {
  const labelDims = data.mapDimensionsAll('defaultedLabel');
  const len = labelDims.length;
  // Simple optimization (in lots of cases, label dims length is 1)
  if (len === 1) {
    const rawVal = retrieveRawValue(data, dataIndex, labelDims[0]);
    return rawVal != null ? rawVal + '' : null;
  } else if (len) {
    const vals = [];
    for (let i = 0; i < labelDims.length; i++) {
      vals.push(retrieveRawValue(data, dataIndex, labelDims[i]));
    }
    return vals.join(' ');
  }
}
export function getDefaultInterpolatedLabel(data, interpolatedValue) {
  const labelDims = data.mapDimensionsAll('defaultedLabel');
  if (!isArray(interpolatedValue)) {
    return interpolatedValue + '';
  }
  const vals = [];
  for (let i = 0; i < labelDims.length; i++) {
    const dimIndex = data.getDimensionIndex(labelDims[i]);
    if (dimIndex >= 0) {
      vals.push(interpolatedValue[dimIndex]);
    }
  }
  return vals.join(' ');
}