
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
import * as zrUtil from 'zrender/lib/core/util.js';
import { retrieveRawValue } from '../../data/helper/dataProvider.js';
import { formatTpl } from '../../util/format.js';
import { error, makePrintable } from '../../util/log.js';
const DIMENSION_LABEL_REG = /\{@(.+?)\}/g;
export class DataFormatMixin {
  /**
   * Get params for formatter
   */
  getDataParams(dataIndex, dataType) {
    const data = this.getData(dataType);
    const rawValue = this.getRawValue(dataIndex, dataType);
    const rawDataIndex = data.getRawIndex(dataIndex);
    const name = data.getName(dataIndex);
    const itemOpt = data.getRawDataItem(dataIndex);
    const style = data.getItemVisual(dataIndex, 'style');
    const color = style && style[data.getItemVisual(dataIndex, 'drawType') || 'fill'];
    const borderColor = style && style.stroke;
    const mainType = this.mainType;
    const isSeries = mainType === 'series';
    const userOutput = data.userOutput && data.userOutput.get();
    return {
      componentType: mainType,
      componentSubType: this.subType,
      componentIndex: this.componentIndex,
      seriesType: isSeries ? this.subType : null,
      seriesIndex: this.seriesIndex,
      seriesId: isSeries ? this.id : null,
      seriesName: isSeries ? this.name : null,
      name: name,
      dataIndex: rawDataIndex,
      data: itemOpt,
      dataType: dataType,
      value: rawValue,
      color: color,
      borderColor: borderColor,
      dimensionNames: userOutput ? userOutput.fullDimensions : null,
      encode: userOutput ? userOutput.encode : null,
      // Param name list for mapping `a`, `b`, `c`, `d`, `e`
      $vars: ['seriesName', 'name', 'value']
    };
  }
  /**
   * Format label
   * @param dataIndex
   * @param status 'normal' by default
   * @param dataType
   * @param labelDimIndex Only used in some chart that
   *        use formatter in different dimensions, like radar.
   * @param formatter Formatter given outside.
   * @return return null/undefined if no formatter
   */
  getFormattedLabel(dataIndex, status, dataType, labelDimIndex, formatter, extendParams) {
    status = status || 'normal';
    const data = this.getData(dataType);
    const params = this.getDataParams(dataIndex, dataType);
    if (extendParams) {
      params.value = extendParams.interpolatedValue;
    }
    if (labelDimIndex != null && zrUtil.isArray(params.value)) {
      params.value = params.value[labelDimIndex];
    }
    if (!formatter) {
      const itemModel = data.getItemModel(dataIndex);
      // @ts-ignore
      formatter = itemModel.get(status === 'normal' ? ['label', 'formatter'] : [status, 'label', 'formatter']);
    }
    if (zrUtil.isFunction(formatter)) {
      params.status = status;
      params.dimensionIndex = labelDimIndex;
      return formatter(params);
    } else if (zrUtil.isString(formatter)) {
      const str = formatTpl(formatter, params);
      // Support 'aaa{@[3]}bbb{@product}ccc'.
      // Do not support '}' in dim name util have to.
      return str.replace(DIMENSION_LABEL_REG, function (origin, dimStr) {
        const len = dimStr.length;
        let dimLoose = dimStr;
        if (dimLoose.charAt(0) === '[' && dimLoose.charAt(len - 1) === ']') {
          dimLoose = +dimLoose.slice(1, len - 1); // Also support: '[]' => 0
          if (process.env.NODE_ENV !== 'production') {
            if (isNaN(dimLoose)) {
              error(`Invalide label formatter: @${dimStr}, only support @[0], @[1], @[2], ...`);
            }
          }
        }
        let val = retrieveRawValue(data, dataIndex, dimLoose);
        if (extendParams && zrUtil.isArray(extendParams.interpolatedValue)) {
          const dimIndex = data.getDimensionIndex(dimLoose);
          if (dimIndex >= 0) {
            val = extendParams.interpolatedValue[dimIndex];
          }
        }
        return val != null ? val + '' : '';
      });
    }
  }
  /**
   * Get raw value in option
   */
  getRawValue(idx, dataType) {
    return retrieveRawValue(this.getData(dataType), idx);
  }
  /**
   * Should be implemented.
   * @param {number} dataIndex
   * @param {boolean} [multipleSeries=false]
   * @param {string} [dataType]
   */
  formatTooltip(dataIndex, multipleSeries, dataType) {
    // Empty function
    return;
  }
}
;
// PENDING: previously we accept this type when calling `formatTooltip`,
// but guess little chance has been used outside. Do we need to backward
// compat it?
// type TooltipFormatResultLegacyObject = {
//     // `html` means the markup language text, either in 'html' or 'richText'.
//     // The name `html` is not appropriate because in 'richText' it is not a HTML
//     // string. But still support it for backward compatibility.
//     html: string;
//     markers: Dictionary<ColorString>;
// };
/**
 * For backward compat, normalize the return from `formatTooltip`.
 */
export function normalizeTooltipFormatResult(result) {
  let markupText;
  // let markers: Dictionary<ColorString>;
  let markupFragment;
  if (zrUtil.isObject(result)) {
    if (result.type) {
      markupFragment = result;
    } else {
      if (process.env.NODE_ENV !== 'production') {
        console.warn('The return type of `formatTooltip` is not supported: ' + makePrintable(result));
      }
    }
    // else {
    //     markupText = (result as TooltipFormatResultLegacyObject).html;
    //     markers = (result as TooltipFormatResultLegacyObject).markers;
    //     if (markersExisting) {
    //         markers = zrUtil.merge(markersExisting, markers);
    //     }
    // }
  } else {
    markupText = result;
  }
  return {
    text: markupText,
    // markers: markers || markersExisting,
    frag: markupFragment
  };
}