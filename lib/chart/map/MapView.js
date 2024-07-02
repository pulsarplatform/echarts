
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
import * as graphic from '../../util/graphic.js';
import MapDraw from '../../component/helper/MapDraw.js';
import ChartView from '../../view/Chart.js';
import { setLabelStyle, getLabelStatesModels } from '../../label/labelStyle.js';
import { setStatesFlag, Z2_EMPHASIS_LIFT } from '../../util/states.js';
class MapView extends ChartView {
  constructor() {
    super(...arguments);
    this.type = MapView.type;
  }
  render(mapModel, ecModel, api, payload) {
    // Not render if it is an toggleSelect action from self
    if (payload && payload.type === 'mapToggleSelect' && payload.from === this.uid) {
      return;
    }
    const group = this.group;
    group.removeAll();
    if (mapModel.getHostGeoModel()) {
      return;
    }
    if (this._mapDraw && payload && payload.type === 'geoRoam') {
      this._mapDraw.resetForLabelLayout();
    }
    // Not update map if it is an roam action from self
    if (!(payload && payload.type === 'geoRoam' && payload.componentType === 'series' && payload.seriesId === mapModel.id)) {
      if (mapModel.needsDrawMap) {
        const mapDraw = this._mapDraw || new MapDraw(api);
        group.add(mapDraw.group);
        mapDraw.draw(mapModel, ecModel, api, this, payload);
        this._mapDraw = mapDraw;
      } else {
        // Remove drawn map
        this._mapDraw && this._mapDraw.remove();
        this._mapDraw = null;
      }
    } else {
      const mapDraw = this._mapDraw;
      mapDraw && group.add(mapDraw.group);
    }
    mapModel.get('showLegendSymbol') && ecModel.getComponent('legend') && this._renderSymbols(mapModel, ecModel, api);
  }
  remove() {
    this._mapDraw && this._mapDraw.remove();
    this._mapDraw = null;
    this.group.removeAll();
  }
  dispose() {
    this._mapDraw && this._mapDraw.remove();
    this._mapDraw = null;
  }
  _renderSymbols(mapModel, ecModel, api) {
    const originalData = mapModel.originalData;
    const group = this.group;
    originalData.each(originalData.mapDimension('value'), function (value, originalDataIndex) {
      if (isNaN(value)) {
        return;
      }
      const layout = originalData.getItemLayout(originalDataIndex);
      if (!layout || !layout.point) {
        // Not exists in map
        return;
      }
      const point = layout.point;
      const offset = layout.offset;
      const circle = new graphic.Circle({
        style: {
          // Because the special of map draw.
          // Which needs statistic of multiple series and draw on one map.
          // And each series also need a symbol with legend color
          //
          // Layout and visual are put one the different data
          // TODO
          fill: mapModel.getData().getVisual('style').fill
        },
        shape: {
          cx: point[0] + offset * 9,
          cy: point[1],
          r: 3
        },
        silent: true,
        // Do not overlap the first series, on which labels are displayed.
        z2: 8 + (!offset ? Z2_EMPHASIS_LIFT + 1 : 0)
      });
      // Only the series that has the first value on the same region is in charge of rendering the label.
      // But consider the case:
      // series: [
      //     {id: 'X', type: 'map', map: 'm', {data: [{name: 'A', value: 11}, {name: 'B', {value: 22}]},
      //     {id: 'Y', type: 'map', map: 'm', {data: [{name: 'A', value: 21}, {name: 'C', {value: 33}]}
      // ]
      // The offset `0` of item `A` is at series `X`, but of item `C` is at series `Y`.
      // For backward compatibility, we follow the rule that render label `A` by the
      // settings on series `X` but render label `C` by the settings on series `Y`.
      if (!offset) {
        const fullData = mapModel.mainSeries.getData();
        const name = originalData.getName(originalDataIndex);
        const fullIndex = fullData.indexOfName(name);
        const itemModel = originalData.getItemModel(originalDataIndex);
        const labelModel = itemModel.getModel('label');
        const regionGroup = fullData.getItemGraphicEl(fullIndex);
        // `getFormattedLabel` needs to use `getData` inside. Here
        // `mapModel.getData()` is shallow cloned from `mainSeries.getData()`.
        // FIXME
        // If this is not the `mainSeries`, the item model (like label formatter)
        // set on original data item will never get. But it has been working
        // like that from the beginning, and this scenario is rarely encountered.
        // So it won't be fixed until we have to.
        setLabelStyle(circle, getLabelStatesModels(itemModel), {
          labelFetcher: {
            getFormattedLabel(idx, state) {
              return mapModel.getFormattedLabel(fullIndex, state);
            }
          },
          defaultText: name
        });
        circle.disableLabelAnimation = true;
        if (!labelModel.get('position')) {
          circle.setTextConfig({
            position: 'bottom'
          });
        }
        regionGroup.onHoverStateChange = function (toState) {
          setStatesFlag(circle, toState);
        };
      }
      group.add(circle);
    });
  }
}
MapView.type = 'map';
export default MapView;