
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
import createRenderPlanner from '../helper/createRenderPlanner.js';
import { extend } from 'zrender/lib/core/util.js';
const positiveBorderColorQuery = ['itemStyle', 'borderColor'];
const negativeBorderColorQuery = ['itemStyle', 'borderColor0'];
const dojiBorderColorQuery = ['itemStyle', 'borderColorDoji'];
const positiveColorQuery = ['itemStyle', 'color'];
const negativeColorQuery = ['itemStyle', 'color0'];
const candlestickVisual = {
  seriesType: 'candlestick',
  plan: createRenderPlanner(),
  // For legend.
  performRawSeries: true,
  reset: function (seriesModel, ecModel) {
    function getColor(sign, model) {
      return model.get(sign > 0 ? positiveColorQuery : negativeColorQuery);
    }
    function getBorderColor(sign, model) {
      return model.get(sign === 0 ? dojiBorderColorQuery : sign > 0 ? positiveBorderColorQuery : negativeBorderColorQuery);
    }
    // Only visible series has each data be visual encoded
    if (ecModel.isSeriesFiltered(seriesModel)) {
      return;
    }
    const isLargeRender = seriesModel.pipelineContext.large;
    return !isLargeRender && {
      progress(params, data) {
        let dataIndex;
        while ((dataIndex = params.next()) != null) {
          const itemModel = data.getItemModel(dataIndex);
          const sign = data.getItemLayout(dataIndex).sign;
          const style = itemModel.getItemStyle();
          style.fill = getColor(sign, itemModel);
          style.stroke = getBorderColor(sign, itemModel) || style.fill;
          const existsStyle = data.ensureUniqueItemVisual(dataIndex, 'style');
          extend(existsStyle, style);
        }
      }
    };
  }
};
export default candlestickVisual;