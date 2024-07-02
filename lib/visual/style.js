
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
import { isFunction, extend, createHashMap } from 'zrender/lib/core/util.js';
import makeStyleMapper from '../model/mixin/makeStyleMapper.js';
import { ITEM_STYLE_KEY_MAP } from '../model/mixin/itemStyle.js';
import { LINE_STYLE_KEY_MAP } from '../model/mixin/lineStyle.js';
import Model from '../model/Model.js';
import { makeInner } from '../util/model.js';
const inner = makeInner();
const defaultStyleMappers = {
  itemStyle: makeStyleMapper(ITEM_STYLE_KEY_MAP, true),
  lineStyle: makeStyleMapper(LINE_STYLE_KEY_MAP, true)
};
const defaultColorKey = {
  lineStyle: 'stroke',
  itemStyle: 'fill'
};
function getStyleMapper(seriesModel, stylePath) {
  const styleMapper = seriesModel.visualStyleMapper || defaultStyleMappers[stylePath];
  if (!styleMapper) {
    console.warn(`Unknown style type '${stylePath}'.`);
    return defaultStyleMappers.itemStyle;
  }
  return styleMapper;
}
function getDefaultColorKey(seriesModel, stylePath) {
  // return defaultColorKey[stylePath] ||
  const colorKey = seriesModel.visualDrawType || defaultColorKey[stylePath];
  if (!colorKey) {
    console.warn(`Unknown style type '${stylePath}'.`);
    return 'fill';
  }
  return colorKey;
}
const seriesStyleTask = {
  createOnAllSeries: true,
  performRawSeries: true,
  reset(seriesModel, ecModel) {
    const data = seriesModel.getData();
    const stylePath = seriesModel.visualStyleAccessPath || 'itemStyle';
    // Set in itemStyle
    const styleModel = seriesModel.getModel(stylePath);
    const getStyle = getStyleMapper(seriesModel, stylePath);
    const globalStyle = getStyle(styleModel);
    const decalOption = styleModel.getShallow('decal');
    if (decalOption) {
      data.setVisual('decal', decalOption);
      decalOption.dirty = true;
    }
    // TODO
    const colorKey = getDefaultColorKey(seriesModel, stylePath);
    const color = globalStyle[colorKey];
    // TODO style callback
    const colorCallback = isFunction(color) ? color : null;
    const hasAutoColor = globalStyle.fill === 'auto' || globalStyle.stroke === 'auto';
    // Get from color palette by default.
    if (!globalStyle[colorKey] || colorCallback || hasAutoColor) {
      // Note: If some series has color specified (e.g., by itemStyle.color), we DO NOT
      // make it effect palette. Because some scenarios users need to make some series
      // transparent or as background, which should better not effect the palette.
      const colorPalette = seriesModel.getColorFromPalette(
      // TODO series count changed.
      seriesModel.name, null, ecModel.getSeriesCount());
      if (!globalStyle[colorKey]) {
        globalStyle[colorKey] = colorPalette;
        data.setVisual('colorFromPalette', true);
      }
      globalStyle.fill = globalStyle.fill === 'auto' || isFunction(globalStyle.fill) ? colorPalette : globalStyle.fill;
      globalStyle.stroke = globalStyle.stroke === 'auto' || isFunction(globalStyle.stroke) ? colorPalette : globalStyle.stroke;
    }
    data.setVisual('style', globalStyle);
    data.setVisual('drawType', colorKey);
    // Only visible series has each data be visual encoded
    if (!ecModel.isSeriesFiltered(seriesModel) && colorCallback) {
      data.setVisual('colorFromPalette', false);
      return {
        dataEach(data, idx) {
          const dataParams = seriesModel.getDataParams(idx);
          const itemStyle = extend({}, globalStyle);
          itemStyle[colorKey] = colorCallback(dataParams);
          data.setItemVisual(idx, 'style', itemStyle);
        }
      };
    }
  }
};
const sharedModel = new Model();
const dataStyleTask = {
  createOnAllSeries: true,
  performRawSeries: true,
  reset(seriesModel, ecModel) {
    if (seriesModel.ignoreStyleOnData || ecModel.isSeriesFiltered(seriesModel)) {
      return;
    }
    const data = seriesModel.getData();
    const stylePath = seriesModel.visualStyleAccessPath || 'itemStyle';
    // Set in itemStyle
    const getStyle = getStyleMapper(seriesModel, stylePath);
    const colorKey = data.getVisual('drawType');
    return {
      dataEach: data.hasItemOption ? function (data, idx) {
        // Not use getItemModel for performance considuration
        const rawItem = data.getRawDataItem(idx);
        if (rawItem && rawItem[stylePath]) {
          sharedModel.option = rawItem[stylePath];
          const style = getStyle(sharedModel);
          const existsStyle = data.ensureUniqueItemVisual(idx, 'style');
          extend(existsStyle, style);
          if (sharedModel.option.decal) {
            data.setItemVisual(idx, 'decal', sharedModel.option.decal);
            sharedModel.option.decal.dirty = true;
          }
          if (colorKey in style) {
            data.setItemVisual(idx, 'colorFromPalette', false);
          }
        }
      } : null
    };
  }
};
// Pick color from palette for the data which has not been set with color yet.
// Note: do not support stream rendering. No such cases yet.
const dataColorPaletteTask = {
  performRawSeries: true,
  overallReset(ecModel) {
    // Each type of series uses one scope.
    // Pie and funnel are using different scopes.
    const paletteScopeGroupByType = createHashMap();
    ecModel.eachSeries(seriesModel => {
      const colorBy = seriesModel.getColorBy();
      if (seriesModel.isColorBySeries()) {
        return;
      }
      const key = seriesModel.type + '-' + colorBy;
      let colorScope = paletteScopeGroupByType.get(key);
      if (!colorScope) {
        colorScope = {};
        paletteScopeGroupByType.set(key, colorScope);
      }
      inner(seriesModel).scope = colorScope;
    });
    ecModel.eachSeries(seriesModel => {
      if (seriesModel.isColorBySeries() || ecModel.isSeriesFiltered(seriesModel)) {
        return;
      }
      const dataAll = seriesModel.getRawData();
      const idxMap = {};
      const data = seriesModel.getData();
      const colorScope = inner(seriesModel).scope;
      const stylePath = seriesModel.visualStyleAccessPath || 'itemStyle';
      const colorKey = getDefaultColorKey(seriesModel, stylePath);
      data.each(function (idx) {
        const rawIdx = data.getRawIndex(idx);
        idxMap[rawIdx] = idx;
      });
      // Iterate on data before filtered. To make sure color from palette can be
      // Consistent when toggling legend.
      dataAll.each(function (rawIdx) {
        const idx = idxMap[rawIdx];
        const fromPalette = data.getItemVisual(idx, 'colorFromPalette');
        // Get color from palette for each data only when the color is inherited from series color, which is
        // also picked from color palette. So following situation is not in the case:
        // 1. series.itemStyle.color is set
        // 2. color is encoded by visualMap
        if (fromPalette) {
          const itemStyle = data.ensureUniqueItemVisual(idx, 'style');
          const name = dataAll.getName(rawIdx) || rawIdx + '';
          const dataCount = dataAll.count();
          itemStyle[colorKey] = seriesModel.getColorFromPalette(name, colorScope, dataCount);
        }
      });
    });
  }
};
export { seriesStyleTask, dataStyleTask, dataColorPaletteTask };