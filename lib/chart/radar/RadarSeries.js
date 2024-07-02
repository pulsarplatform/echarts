
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
import SeriesModel from '../../model/Series.js';
import createSeriesDataSimply from '../helper/createSeriesDataSimply.js';
import * as zrUtil from 'zrender/lib/core/util.js';
import LegendVisualProvider from '../../visual/LegendVisualProvider.js';
import { createTooltipMarkup, retrieveVisualColorForTooltipMarker } from '../../component/tooltip/tooltipMarkup.js';
class RadarSeriesModel extends SeriesModel {
  constructor() {
    super(...arguments);
    this.type = RadarSeriesModel.type;
    this.hasSymbolVisual = true;
  }
  // Overwrite
  init(option) {
    super.init.apply(this, arguments);
    // Enable legend selection for each data item
    // Use a function instead of direct access because data reference may changed
    this.legendVisualProvider = new LegendVisualProvider(zrUtil.bind(this.getData, this), zrUtil.bind(this.getRawData, this));
  }
  getInitialData(option, ecModel) {
    return createSeriesDataSimply(this, {
      generateCoord: 'indicator_',
      generateCoordCount: Infinity
    });
  }
  formatTooltip(dataIndex, multipleSeries, dataType) {
    const data = this.getData();
    const coordSys = this.coordinateSystem;
    const indicatorAxes = coordSys.getIndicatorAxes();
    const name = this.getData().getName(dataIndex);
    const nameToDisplay = name === '' ? this.name : name;
    const markerColor = retrieveVisualColorForTooltipMarker(this, dataIndex);
    return createTooltipMarkup('section', {
      header: nameToDisplay,
      sortBlocks: true,
      blocks: zrUtil.map(indicatorAxes, axis => {
        const val = data.get(data.mapDimension(axis.dim), dataIndex);
        return createTooltipMarkup('nameValue', {
          markerType: 'subItem',
          markerColor: markerColor,
          name: axis.name,
          value: val,
          sortParam: val
        });
      })
    });
  }
  getTooltipPosition(dataIndex) {
    if (dataIndex != null) {
      const data = this.getData();
      const coordSys = this.coordinateSystem;
      const values = data.getValues(zrUtil.map(coordSys.dimensions, function (dim) {
        return data.mapDimension(dim);
      }), dataIndex);
      for (let i = 0, len = values.length; i < len; i++) {
        if (!isNaN(values[i])) {
          const indicatorAxes = coordSys.getIndicatorAxes();
          return coordSys.coordToPoint(indicatorAxes[i].dataToCoord(values[i]), i);
        }
      }
    }
  }
}
RadarSeriesModel.type = 'series.radar';
RadarSeriesModel.dependencies = ['radar'];
RadarSeriesModel.defaultOption = {
  // zlevel: 0,
  z: 2,
  colorBy: 'data',
  coordinateSystem: 'radar',
  legendHoverLink: true,
  radarIndex: 0,
  lineStyle: {
    width: 2,
    type: 'solid',
    join: 'round'
  },
  label: {
    position: 'top'
  },
  // areaStyle: {
  // },
  // itemStyle: {}
  symbolSize: 8
  // symbolRotate: null
};

export default RadarSeriesModel;