# Documentação: https://tradingview.github.io/lightweight-charts/docs

## Table of Contents
- [Getting started](#getting-started)
- [Interface: IChartApi](#interface-ichartapi)
- [Interface: ISeriesApi<TSeriesType, HorzScaleItem, TData, TOptions, TPartialOptions>](#interface-iseriesapi<tseriestype,-horzscaleitem,-tdata,-toptions,-tpartialoptions>)
- [Function: createChart()](#function-createchart)
- [Series](#series)
- [Interface: ITimeScaleApi<HorzScaleItem>](#interface-itimescaleapi<horzscaleitem>)
- [Type alias: LineSeriesOptions](#type-alias-lineseriesoptions)
- [Interface: SeriesOptionsMap](#interface-seriesoptionsmap)
- [Interface: SeriesDataItemTypeMap<HorzScaleItem>](#interface-seriesdataitemtypemap<horzscaleitem>)
- [Interface: IChartApiBase<HorzScaleItem>](#interface-ichartapibase<horzscaleitem>)
- [Interface: CustomData<HorzScaleItem>](#interface-customdata<horzscaleitem>)
- [Type alias: MouseEventHandler()<HorzScaleItem>](#type-alias-mouseeventhandler<horzscaleitem>)
- [Interface: CandlestickData<HorzScaleItem>](#interface-candlestickdata<horzscaleitem>)
- [Interface: IPaneApi<HorzScaleItem>](#interface-ipaneapi<horzscaleitem>)
- [Interface: SeriesPartialOptionsMap](#interface-seriespartialoptionsmap)
- [Type alias: AreaSeriesOptions](#type-alias-areaseriesoptions)
- [Interface: BaselineData<HorzScaleItem>](#interface-baselinedata<horzscaleitem>)
- [Interface: CustomSeriesWhitespaceData<HorzScaleItem>](#interface-customserieswhitespacedata<horzscaleitem>)
- [Interface: BaselineStyleOptions](#interface-baselinestyleoptions)
- [Type alias: BarSeriesOptions](#type-alias-barseriesoptions)
- [Interface: SeriesDefinition<T>](#interface-seriesdefinition<t>)
- [Interface: HistogramData<HorzScaleItem>](#interface-histogramdata<horzscaleitem>)
- [Type alias: BaselineSeriesOptions](#type-alias-baselineseriesoptions)
- [Interface: LineData<HorzScaleItem>](#interface-linedata<horzscaleitem>)
- [Type alias: Time](#type-alias-time)
- [Interface: ICustomSeriesPaneView<HorzScaleItem, TData, TSeriesOptions>](#interface-icustomseriespaneview<horzscaleitem,-tdata,-tseriesoptions>)
- [Interface: AreaData<HorzScaleItem>](#interface-areadata<horzscaleitem>)
- [Interface: PaneSize](#interface-panesize)
- [Interface: HistogramStyleOptions](#interface-histogramstyleoptions)
- [Interface: BarData<HorzScaleItem>](#interface-bardata<horzscaleitem>)
- [Interface: ChartOptionsImpl<HorzScaleItem>](#interface-chartoptionsimpl<horzscaleitem>)
- [Interface: IHorzScaleBehavior<HorzScaleItem>](#interface-ihorzscalebehavior<horzscaleitem>)
- [Interface: LineStyleOptions](#interface-linestyleoptions)
- [Interface: AreaStyleOptions](#interface-areastyleoptions)
- [Interface: SeriesOptionsCommon](#interface-seriesoptionscommon)
- [Interface: WhitespaceData<HorzScaleItem>](#interface-whitespacedata<horzscaleitem>)
- [Type alias: CustomSeriesOptions](#type-alias-customseriesoptions)
- [Interface: CustomStyleOptions](#interface-customstyleoptions)
- [Type alias: HistogramSeriesOptions](#type-alias-histogramseriesoptions)
- [Interface: CandlestickStyleOptions](#interface-candlestickstyleoptions)
- [Interface: BarStyleOptions](#interface-barstyleoptions)
- [Type alias: DeepPartial<T>](#type-alias-deeppartial<t>)
- [Interface: TimeChartOptions](#interface-timechartoptions)
- [Type alias: CandlestickSeriesOptions](#type-alias-candlestickseriesoptions)
- [Interface: IPriceScaleApi](#interface-ipricescaleapi)
- [Type alias: BarPrice](#type-alias-barprice)
- [Type alias: CreatePriceLineOptions](#type-alias-createpricelineoptions)
- [Type alias: DataChangedHandler()](#type-alias-datachangedhandler)
- [Type alias: Coordinate](#type-alias-coordinate)
- [Type alias: LastValueDataResult](#type-alias-lastvaluedataresult)
- [Interface: IRange<T>](#interface-irange<t>)
- [Interface: BarsInfo<HorzScaleItem>](#interface-barsinfo<horzscaleitem>)
- [Type alias: SeriesType](#type-alias-seriestype)
- [Time scale](#time-scale)
- [Interface: IPriceLine](#interface-ipriceline)
- [Type alias: ISeriesPrimitive<HorzScaleItem>](#type-alias-iseriesprimitive<horzscaleitem>)
- [Enumeration: MismatchDirection](#enumeration-mismatchdirection)
- [Interface: IPriceFormatter](#interface-ipriceformatter)
- [Plugins](#plugins)
- [Interface: SingleValueData<HorzScaleItem>](#interface-singlevaluedata<horzscaleitem>)
- [Variable: AreaSeries](#variable-areaseries)
- [Variable: BarSeries](#variable-barseries)
- [Variable: LineSeries](#variable-lineseries)
- [Variable: CandlestickSeries](#variable-candlestickseries)
- [Variable: BaselineSeries](#variable-baselineseries)
- [Interface: SeriesStyleOptionsMap](#interface-seriesstyleoptionsmap)
- [Variable: HistogramSeries](#variable-histogramseries)
- [Type alias: LogicalRange](#type-alias-logicalrange)
- [Type alias: SizeChangeEventHandler()](#type-alias-sizechangeeventhandler)
- [Type alias: TimePointIndex](#type-alias-timepointindex)
- [Type alias: TimeRangeChangeEventHandler()<HorzScaleItem>](#type-alias-timerangechangeeventhandler<horzscaleitem>)
- [Type alias: LogicalRangeChangeEventHandler()](#type-alias-logicalrangechangeeventhandler)
- [Type alias: Logical](#type-alias-logical)
- [Interface: HorzScaleOptions](#interface-horzscaleoptions)
- [Type alias: SeriesOptions<T>](#type-alias-seriesoptions<t>)
- [Interface: MouseEventParams<HorzScaleItem>](#interface-mouseeventparams<horzscaleitem>)
- [Interface: OhlcData<HorzScaleItem>](#interface-ohlcdata<horzscaleitem>)
- [Type alias: IPanePrimitive<HorzScaleItem>](#type-alias-ipaneprimitive<horzscaleitem>)
- [Type alias: BarSeriesPartialOptions](#type-alias-barseriespartialoptions)
- [Type alias: LineWidth](#type-alias-linewidth)
- [Interface: BaseValuePrice](#interface-basevalueprice)
- [Enumeration: LineStyle](#enumeration-linestyle)
- [Enumeration: LineType](#enumeration-linetype)
- [Enumeration: LastPriceAnimationMode](#enumeration-lastpriceanimationmode)
- [Interface: BusinessDay](#interface-businessday)
- [Type alias: UTCTimestamp](#type-alias-utctimestamp)
- [Interface: PaneRendererCustomData<HorzScaleItem, TData>](#interface-panerenderercustomdata<horzscaleitem,-tdata>)
- [Type alias: CustomSeriesPricePlotValues](#type-alias-customseriespriceplotvalues)
- [Interface: ICustomSeriesPaneRenderer](#interface-icustomseriespanerenderer)
- [Interface: ChartOptionsBase](#interface-chartoptionsbase)
- [Interface: CrosshairOptions](#interface-crosshairoptions)
- [Interface: KineticScrollOptions](#interface-kineticscrolloptions)
- [Interface: GridOptions](#interface-gridoptions)
- [Interface: LocalizationOptions<HorzScaleItem>](#interface-localizationoptions<horzscaleitem>)
- [Interface: TrackingModeOptions](#interface-trackingmodeoptions)
- [Interface: PriceScaleOptions](#interface-pricescaleoptions)
- [Interface: HandleScrollOptions](#interface-handlescrolloptions)
- [Interface: PriceChartOptions](#interface-pricechartoptions)
- [Interface: YieldCurveChartOptions](#interface-yieldcurvechartoptions)
- [Interface: HandleScaleOptions](#interface-handlescaleoptions)
- [Interface: LayoutOptions](#interface-layoutoptions)
- [Type alias: OverlayPriceScaleOptions](#type-alias-overlaypricescaleoptions)
- [Interface: TimeMark](#interface-timemark)
- [Type alias: HorzScaleItemConverterToInternalObj()<HorzScaleItem>](#type-alias-horzscaleitemconvertertointernalobj<horzscaleitem>)
- [Type alias: InternalHorzScaleItemKey](#type-alias-internalhorzscaleitemkey)
- [Interface: TickMark](#interface-tickmark)
- [Interface: TimeScalePoint](#interface-timescalepoint)
- [Type alias: DataItem<HorzScaleItem>](#type-alias-dataitem<horzscaleitem>)
- [Type alias: Mutable<T>](#type-alias-mutable<t>)
- [Type alias: TickMarkWeightValue](#type-alias-tickmarkweightvalue)
- [Type alias: PriceFormat](#type-alias-priceformat)
- [Enumeration: PriceLineSource](#enumeration-pricelinesource)
- [Interface: AutoscaleInfo](#interface-autoscaleinfo)
- [Type alias: AutoscaleInfoProvider()](#type-alias-autoscaleinfoprovider)
- [Interface: TimeScaleOptions](#interface-timescaleoptions)
- [Type alias: Nominal<T, Name>](#type-alias-nominal<t,-name>)
- [Interface: PriceLineOptions](#interface-pricelineoptions)
- [Type alias: DataChangedScope](#type-alias-datachangedscope)
- [Interface: LastValueDataResultWithData](#interface-lastvaluedataresultwithdata)
- [Interface: LastValueDataResultWithoutData](#interface-lastvaluedataresultwithoutdata)
- [Chart types](#chart-types)
- [Interface: ISeriesPrimitiveBase<TSeriesAttachedParameters>](#interface-iseriesprimitivebase<tseriesattachedparameters>)
- [Interface: SeriesAttachedParameter<HorzScaleItem, TSeriesType>](#interface-seriesattachedparameter<horzscaleitem,-tseriestype>)
- [Series Primitives](#series-primitives)
- [Custom Series Types](#custom-series-types)
- [Pane Primitives](#pane-primitives)
- [Interface: Point](#interface-point)
- [Interface: TouchMouseEventData](#interface-touchmouseeventdata)
- [Interface: PaneAttachedParameter<HorzScaleItem>](#interface-paneattachedparameter<horzscaleitem>)
- [Interface: IPanePrimitiveBase<TPaneAttachedParameters>](#interface-ipaneprimitivebase<tpaneattachedparameters>)
- [Type alias: SeriesPartialOptions<T>](#type-alias-seriespartialoptions<t>)
- [Interface: CustomBarItemData<HorzScaleItem, TData>](#interface-custombaritemdata<horzscaleitem,-tdata>)
- [Type alias: PriceToCoordinateConverter()](#type-alias-pricetocoordinateconverter)
- [Interface: LocalizationOptionsBase](#interface-localizationoptionsbase)
- [Interface: CrosshairLineOptions](#interface-crosshairlineoptions)
- [Enumeration: CrosshairMode](#enumeration-crosshairmode)
- [Interface: GridLineOptions](#interface-gridlineoptions)
- [Type alias: PercentageFormatterFn()](#type-alias-percentageformatterfn)
- [Type alias: TickmarksPriceFormatterFn()](#type-alias-tickmarkspriceformatterfn)
- [Type alias: PriceFormatterFn()](#type-alias-priceformatterfn)
- [Type alias: TimeFormatterFn()<HorzScaleItem>](#type-alias-timeformatterfn<horzscaleitem>)
- [Type alias: TickmarksPercentageFormatterFn()](#type-alias-tickmarkspercentageformatterfn)
- [Interface: PriceFormatCustom](#interface-priceformatcustom)
- [Interface: PriceChartLocalizationOptions](#interface-pricechartlocalizationoptions)
- [Enumeration: TrackingModeExitMode](#enumeration-trackingmodeexitmode)
- [Interface: PriceScaleMargins](#interface-pricescalemargins)
- [Enumeration: PriceScaleMode](#enumeration-pricescalemode)
- [Interface: YieldCurveOptions](#interface-yieldcurveoptions)
- [Interface: AxisDoubleClickOptions](#interface-axisdoubleclickoptions)
- [Interface: AxisPressedMouseMoveOptions](#interface-axispressedmousemoveoptions)
- [Type alias: CustomColorParser()](#type-alias-customcolorparser)
- [Interface: LayoutPanesOptions](#interface-layoutpanesoptions)
- [Type alias: ColorSpace](#type-alias-colorspace)
- [Type alias: Background](#type-alias-background)
- [Type alias: Rgba](#type-alias-rgba)
- [Type alias: InternalHorzScaleItem](#type-alias-internalhorzscaleitem)
- [Interface: PriceFormatBuiltIn](#interface-priceformatbuiltin)
- [Interface: AutoScaleMargins](#interface-autoscalemargins)
- [Interface: PriceRange](#interface-pricerange)
- [Type alias: TickMarkFormatter()](#type-alias-tickmarkformatter)
- [Function: createChartEx()](#function-createchartex)
- [Function: createYieldCurveChart()](#function-createyieldcurvechart)
- [Function: createOptionsChart()](#function-createoptionschart)
- [Interface: PrimitiveHoveredItem](#interface-primitivehovereditem)
- [Interface: IPrimitivePaneView](#interface-iprimitivepaneview)
- [Interface: ISeriesPrimitiveAxisView](#interface-iseriesprimitiveaxisview)
- [Interface: IPrimitivePaneRenderer](#interface-iprimitivepanerenderer)
- [Type alias: PrimitivePaneViewZOrder](#type-alias-primitivepaneviewzorder)
- [Canvas Rendering Target](#canvas-rendering-target)
- [Interface: IPanePrimitivePaneView](#interface-ipaneprimitivepaneview)
- [Type alias: HorzScalePriceItem](#type-alias-horzscalepriceitem)
- [Interface: VerticalGradientColor](#interface-verticalgradientcolor)
- [Interface: SolidColor](#interface-solidcolor)
- [Type alias: AlphaComponent](#type-alias-alphacomponent)
- [Type alias: BlueComponent](#type-alias-bluecomponent)
- [Type alias: GreenComponent](#type-alias-greencomponent)
- [Type alias: RedComponent](#type-alias-redcomponent)
- [Enumeration: TickMarkType](#enumeration-tickmarktype)
- [Interface: IYieldCurveChartApi](#interface-iyieldcurvechartapi)
- [Interface: DrawingUtils](#interface-drawingutils)
- [Enumeration: ColorType](#enumeration-colortype)
- [Type alias: YieldCurveSeriesType](#type-alias-yieldcurveseriestype)

---

# lightweight-charts docs

## Requirements​

Lightweight Charts™ is a client-side library that is not designed to work on the server side, for example, with Node.js.

The library code targets the ES2020 language specification.
Therefore, the browsers you work with should support this language revision. Consider the following table to ensure the browser compatibility.

To support previous revisions, you can set up a transpilation process for the lightweight-charts package in your build system using tools such as Babel.
If you encounter any issues, open a GitHub issue with detailed information, and we will investigate potential solutions.

`lightweight-charts`
## Installation​

To set up the library, install the lightweight-charts npm package:

`lightweight-charts`
```text
npm install --save lightweight-charts
```

The package includes TypeScript declarations, enabling seamless integration within TypeScript projects.

### Build variants​

The library ships with the following build variants:

`window.LightweightCharts`
`lightweight-charts.production.mjs`
`lightweight-charts.development.mjs`
`lightweight-charts.standalone.production.mjs`
`lightweight-charts.standalone.production.js`
`lightweight-charts.standalone.development.mjs`
`lightweight-charts.standalone.development.js`
## License and attribution​

The Lightweight Charts™ license requires specifying TradingView as the product creator.
You should add the following attributes to a public page of your website or mobile application:

- Attribution notice from the NOTICE file

- The https://www.tradingview.com link

`NOTICE`
## Creating a chart​

As a first step, import the library to your file:

```text
import { createChart } from 'lightweight-charts';
```

To create a chart, use the createChart function. You can call the function multiple times to create as many charts as needed:

`createChart`
```text
import { createChart } from 'lightweight-charts';// ...const firstChart = createChart(document.getElementById('firstContainer'));const secondChart = createChart(document.getElementById('secondContainer'));
```

As a result, createChart returns an IChartApi object that allows you to interact with the created chart.

`createChart`
`IChartApi`
## Creating a series​

When the chart is created, you can display data on it.

The basic primitive to display data is a series.
The library supports the following series types:

- Area

- Bar

- Baseline

- Candlestick

- Histogram

- Line

To create a series, use the addSeries method from IChartApi.
As a parameter, specify a series type you would like to create:

`addSeries`
`IChartApi`
```text
import { AreaSeries, BarSeries, BaselineSeries, createChart } from 'lightweight-charts';const chart = createChart(container);const areaSeries = chart.addSeries(AreaSeries);const barSeries = chart.addSeries(BarSeries);const baselineSeries = chart.addSeries(BaselineSeries);// ...
```

Note that a series cannot be transferred from one type to another one, since different series types require different data and options types.

## Setting and updating a data​

When the series is created, you can populate it with data.
Note that the API calls remain the same regardless of the series type, although the data format may vary.

### Setting the data to a series​

To set the data to a series, you should call the ISeriesApi.setData method:

`ISeriesApi.setData`
```text
const chartOptions = { layout: { textColor: 'black', background: { type: 'solid', color: 'white' } } };const chart = createChart(document.getElementById('container'), chartOptions);const areaSeries = chart.addSeries(AreaSeries, {    lineColor: '#2962FF', topColor: '#2962FF',    bottomColor: 'rgba(41, 98, 255, 0.28)',});areaSeries.setData([    { time: '2018-12-22', value: 32.51 },    { time: '2018-12-23', value: 31.11 },    { time: '2018-12-24', value: 27.02 },    { time: '2018-12-25', value: 27.32 },    { time: '2018-12-26', value: 25.17 },    { time: '2018-12-27', value: 28.89 },    { time: '2018-12-28', value: 25.46 },    { time: '2018-12-29', value: 23.92 },    { time: '2018-12-30', value: 22.68 },    { time: '2018-12-31', value: 22.67 },]);const candlestickSeries = chart.addSeries(CandlestickSeries, {    upColor: '#26a69a', downColor: '#ef5350', borderVisible: false,    wickUpColor: '#26a69a', wickDownColor: '#ef5350',});candlestickSeries.setData([    { time: '2018-12-22', open: 75.16, high: 82.84, low: 36.16, close: 45.72 },    { time: '2018-12-23', open: 45.12, high: 53.90, low: 45.12, close: 48.09 },    { time: '2018-12-24', open: 60.71, high: 60.71, low: 53.39, close: 59.29 },    { time: '2018-12-25', open: 68.26, high: 68.26, low: 59.04, close: 60.50 },    { time: '2018-12-26', open: 67.71, high: 105.85, low: 66.67, close: 91.04 },    { time: '2018-12-27', open: 91.04, high: 121.40, low: 82.70, close: 111.40 },    { time: '2018-12-28', open: 111.51, high: 142.83, low: 103.34, close: 131.25 },    { time: '2018-12-29', open: 131.33, high: 151.17, low: 77.68, close: 96.43 },    { time: '2018-12-30', open: 106.33, high: 110.20, low: 90.39, close: 98.10 },    { time: '2018-12-31', open: 109.87, high: 114.69, low: 85.66, close: 111.26 },]);chart.timeScale().fitContent();
```

You can also use setData to replace all data items.

`setData`
### Updating the data in a series​

If your data is updated, for example in real-time, you may also need to refresh the chart accordingly.
To do this, call the ISeriesApi.update method that allows you to update the last data item or add a new one.

`ISeriesApi.update`
```text
import { AreaSeries, CandlestickSeries, createChart } from 'lightweight-charts';const chart = createChart(container);const areaSeries = chart.addSeries(AreaSeries);areaSeries.setData([    // Other data items    { time: '2018-12-31', value: 22.67 },]);const candlestickSeries = chart.addSeries(CandlestickSeries);candlestickSeries.setData([    // Other data items    { time: '2018-12-31', open: 109.87, high: 114.69, low: 85.66, close: 111.26 },]);// ...// Update the most recent barareaSeries.update({ time: '2018-12-31', value: 25 });candlestickSeries.update({ time: '2018-12-31', open: 109.87, high: 114.69, low: 85.66, close: 112 });// Creating the new barareaSeries.update({ time: '2019-01-01', value: 20 });candlestickSeries.update({ time: '2019-01-01', open: 112, high: 112, low: 100, close: 101 });
```

We do not recommend calling ISeriesApi.setData to update the chart, as this method replaces all series data and can significantly affect the performance.

`ISeriesApi.setData`
- RequirementsInstallationBuild variantsLicense and attributionCreating a chartCreating a seriesSetting and updating a dataSetting the data to a seriesUpdating the data in a series

- Build variants

- Setting the data to a seriesUpdating the data in a series

---

# lightweight-charts docs api interfaces IChartApi

The main interface of a single chart using time for horizontal scale.

## Extends​

- IChartApiBase <Time>

`IChartApiBase`
`Time`
## Methods​

### applyOptions()​

applyOptions(options): void

`options`
`void`
Applies new options to the chart

#### Parameters​

• options: DeepPartial <TimeChartOptions>

`DeepPartial`
`TimeChartOptions`
Any subset of options.

#### Returns​

void

`void`
#### Overrides​

IChartApiBase . applyOptions

`IChartApiBase`
`applyOptions`
### remove()​

remove(): void

`void`
Removes the chart object including all DOM elements. This is an irreversible operation, you cannot do anything with the chart after removing it.

#### Returns​

void

`void`
#### Inherited from​

IChartApiBase . remove

`IChartApiBase`
`remove`
### resize()​

resize(width, height, forceRepaint?): void

`width`
`height`
`forceRepaint`
`void`
Sets fixed size of the chart. By default chart takes up 100% of its container.

If chart has the autoSize option enabled, and the ResizeObserver is available then
the width and height values will be ignored.

`autoSize`
#### Parameters​

• width: number

`number`
Target width of the chart.

• height: number

`number`
Target height of the chart.

• forceRepaint?: boolean

`boolean`
True to initiate resize immediately. One could need this to get screenshot immediately after resize.

#### Returns​

void

`void`
#### Inherited from​

IChartApiBase . resize

`IChartApiBase`
`resize`
### addCustomSeries()​

addCustomSeries<TData, TOptions, TPartialOptions>(customPaneView, customOptions?, paneIndex?): ISeriesApi<"Custom", Time, TData | WhitespaceData <Time>, TOptions, TPartialOptions>

`TData`
`TOptions`
`TPartialOptions`
`customPaneView`
`customOptions`
`paneIndex`
`ISeriesApi`
`"Custom"`
`Time`
`TData`
`WhitespaceData`
`Time`
`TOptions`
`TPartialOptions`
Creates a custom series with specified parameters.

A custom series is a generic series which can be extended with a custom renderer to
implement chart types which the library doesn't support by default.

#### Type parameters​

• TData extends CustomData <Time>

`CustomData`
`Time`
• TOptions extends CustomSeriesOptions

`CustomSeriesOptions`
• TPartialOptions extends DeepPartial<TOptions & SeriesOptionsCommon> = DeepPartial<TOptions & SeriesOptionsCommon>

`DeepPartial`
`TOptions`
`SeriesOptionsCommon`
`DeepPartial`
`TOptions`
`SeriesOptionsCommon`
#### Parameters​

• customPaneView: ICustomSeriesPaneView <Time, TData, TOptions>

`ICustomSeriesPaneView`
`Time`
`TData`
`TOptions`
A custom series pane view which implements the custom renderer.

• customOptions?: DeepPartial<TOptions & SeriesOptionsCommon>

`DeepPartial`
`TOptions`
`SeriesOptionsCommon`
Customization parameters of the series being created.

```text
const series = chart.addCustomSeries(myCustomPaneView);
```

• paneIndex?: number

`number`
#### Returns​

ISeriesApi<"Custom", Time, TData | WhitespaceData <Time>, TOptions, TPartialOptions>

`ISeriesApi`
`"Custom"`
`Time`
`TData`
`WhitespaceData`
`Time`
`TOptions`
`TPartialOptions`
#### Inherited from​

IChartApiBase . addCustomSeries

`IChartApiBase`
`addCustomSeries`
### addSeries()​

addSeries<T>(definition, options?, paneIndex?): ISeriesApi<T, Time, SeriesDataItemTypeMap <Time>[T], SeriesOptionsMap[T], SeriesPartialOptionsMap[T]>

`T`
`definition`
`options`
`paneIndex`
`ISeriesApi`
`T`
`Time`
`SeriesDataItemTypeMap`
`Time`
`T`
`SeriesOptionsMap`
`T`
`SeriesPartialOptionsMap`
`T`
Creates a series with specified parameters.

#### Type parameters​

• T extends keyof SeriesOptionsMap

`SeriesOptionsMap`
#### Parameters​

• definition: SeriesDefinition<T>

`SeriesDefinition`
`T`
A series definition.

• options?: SeriesPartialOptionsMap[T]

`SeriesPartialOptionsMap`
`T`
Customization parameters of the series being created.

• paneIndex?: number

`number`
An index of the pane where the series should be created.

```text
const series = chart.addSeries(LineSeries, { lineWidth: 2 });
```

#### Returns​

ISeriesApi<T, Time, SeriesDataItemTypeMap <Time>[T], SeriesOptionsMap[T], SeriesPartialOptionsMap[T]>

`ISeriesApi`
`T`
`Time`
`SeriesDataItemTypeMap`
`Time`
`T`
`SeriesOptionsMap`
`T`
`SeriesPartialOptionsMap`
`T`
#### Inherited from​

IChartApiBase . addSeries

`IChartApiBase`
`addSeries`
### removeSeries()​

removeSeries(seriesApi): void

`seriesApi`
`void`
Removes a series of any type. This is an irreversible operation, you cannot do anything with the series after removing it.

#### Parameters​

• seriesApi: ISeriesApi<keyof SeriesOptionsMap, Time, CustomData <Time> | WhitespaceData <Time> | AreaData <Time> | BarData <Time> | CandlestickData <Time> | BaselineData <Time> | LineData <Time> | HistogramData <Time> | CustomSeriesWhitespaceData <Time>, CustomSeriesOptions | AreaSeriesOptions | BarSeriesOptions | CandlestickSeriesOptions | BaselineSeriesOptions | LineSeriesOptions | HistogramSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon> | DeepPartial <BarStyleOptions & SeriesOptionsCommon> | DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon> | DeepPartial <BaselineStyleOptions & SeriesOptionsCommon> | DeepPartial <LineStyleOptions & SeriesOptionsCommon> | DeepPartial <HistogramStyleOptions & SeriesOptionsCommon> | DeepPartial <CustomStyleOptions & SeriesOptionsCommon>>

`ISeriesApi`
`SeriesOptionsMap`
`Time`
`CustomData`
`Time`
`WhitespaceData`
`Time`
`AreaData`
`Time`
`BarData`
`Time`
`CandlestickData`
`Time`
`BaselineData`
`Time`
`LineData`
`Time`
`HistogramData`
`Time`
`CustomSeriesWhitespaceData`
`Time`
`CustomSeriesOptions`
`AreaSeriesOptions`
`BarSeriesOptions`
`CandlestickSeriesOptions`
`BaselineSeriesOptions`
`LineSeriesOptions`
`HistogramSeriesOptions`
`DeepPartial`
`AreaStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`BarStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`CandlestickStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`BaselineStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`LineStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`HistogramStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`CustomStyleOptions`
`SeriesOptionsCommon`
#### Returns​

void

`void`
#### Inherited from​

IChartApiBase . removeSeries

`IChartApiBase`
`removeSeries`
#### Example​

```text
chart.removeSeries(series);
```

### subscribeClick()​

subscribeClick(handler): void

`handler`
`void`
Subscribe to the chart click event.

#### Parameters​

• handler: MouseEventHandler <Time>

`MouseEventHandler`
`Time`
Handler to be called on mouse click.

#### Returns​

void

`void`
#### Inherited from​

IChartApiBase . subscribeClick

`IChartApiBase`
`subscribeClick`
#### Example​

```text
function myClickHandler(param) {    if (!param.point) {        return;    }    console.log(`Click at ${param.point.x}, ${param.point.y}. The time is ${param.time}.`);}chart.subscribeClick(myClickHandler);
```

### unsubscribeClick()​

unsubscribeClick(handler): void

`handler`
`void`
Unsubscribe a handler that was previously subscribed using subscribeClick.

#### Parameters​

• handler: MouseEventHandler <Time>

`MouseEventHandler`
`Time`
Previously subscribed handler

#### Returns​

void

`void`
#### Inherited from​

IChartApiBase . unsubscribeClick

`IChartApiBase`
`unsubscribeClick`
#### Example​

```text
chart.unsubscribeClick(myClickHandler);
```

### subscribeDblClick()​

subscribeDblClick(handler): void

`handler`
`void`
Subscribe to the chart double-click event.

#### Parameters​

• handler: MouseEventHandler <Time>

`MouseEventHandler`
`Time`
Handler to be called on mouse double-click.

#### Returns​

void

`void`
#### Inherited from​

IChartApiBase . subscribeDblClick

`IChartApiBase`
`subscribeDblClick`
#### Example​

```text
function myDblClickHandler(param) {    if (!param.point) {        return;    }    console.log(`Double Click at ${param.point.x}, ${param.point.y}. The time is ${param.time}.`);}chart.subscribeDblClick(myDblClickHandler);
```

### unsubscribeDblClick()​

unsubscribeDblClick(handler): void

`handler`
`void`
Unsubscribe a handler that was previously subscribed using subscribeDblClick.

#### Parameters​

• handler: MouseEventHandler <Time>

`MouseEventHandler`
`Time`
Previously subscribed handler

#### Returns​

void

`void`
#### Inherited from​

IChartApiBase . unsubscribeDblClick

`IChartApiBase`
`unsubscribeDblClick`
#### Example​

```text
chart.unsubscribeDblClick(myDblClickHandler);
```

### subscribeCrosshairMove()​

subscribeCrosshairMove(handler): void

`handler`
`void`
Subscribe to the crosshair move event.

#### Parameters​

• handler: MouseEventHandler <Time>

`MouseEventHandler`
`Time`
Handler to be called on crosshair move.

#### Returns​

void

`void`
#### Inherited from​

IChartApiBase . subscribeCrosshairMove

`IChartApiBase`
`subscribeCrosshairMove`
#### Example​

```text
function myCrosshairMoveHandler(param) {    if (!param.point) {        return;    }    console.log(`Crosshair moved to ${param.point.x}, ${param.point.y}. The time is ${param.time}.`);}chart.subscribeCrosshairMove(myCrosshairMoveHandler);
```

### unsubscribeCrosshairMove()​

unsubscribeCrosshairMove(handler): void

`handler`
`void`
Unsubscribe a handler that was previously subscribed using subscribeCrosshairMove.

#### Parameters​

• handler: MouseEventHandler <Time>

`MouseEventHandler`
`Time`
Previously subscribed handler

#### Returns​

void

`void`
#### Inherited from​

IChartApiBase . unsubscribeCrosshairMove

`IChartApiBase`
`unsubscribeCrosshairMove`
#### Example​

```text
chart.unsubscribeCrosshairMove(myCrosshairMoveHandler);
```

### priceScale()​

priceScale(priceScaleId, paneIndex?): IPriceScaleApi

`priceScaleId`
`paneIndex`
`IPriceScaleApi`
Returns API to manipulate a price scale.

#### Parameters​

• priceScaleId: string

`string`
ID of the price scale.

• paneIndex?: number

`number`
Index of the pane (default: 0)

#### Returns​

IPriceScaleApi

`IPriceScaleApi`
Price scale API.

#### Inherited from​

IChartApiBase . priceScale

`IChartApiBase`
`priceScale`
### timeScale()​

timeScale(): ITimeScaleApi <Time>

`ITimeScaleApi`
`Time`
Returns API to manipulate the time scale

#### Returns​

ITimeScaleApi <Time>

`ITimeScaleApi`
`Time`
Target API

#### Inherited from​

IChartApiBase . timeScale

`IChartApiBase`
`timeScale`
### options()​

options(): Readonly <ChartOptionsImpl <Time>>

`Readonly`
`ChartOptionsImpl`
`Time`
Returns currently applied options

#### Returns​

Readonly <ChartOptionsImpl <Time>>

`Readonly`
`ChartOptionsImpl`
`Time`
Full set of currently applied options, including defaults

#### Inherited from​

IChartApiBase . options

`IChartApiBase`
`options`
### takeScreenshot()​

takeScreenshot(addTopLayer?, includeCrosshair?): HTMLCanvasElement

`addTopLayer`
`includeCrosshair`
`HTMLCanvasElement`
Make a screenshot of the chart with all the elements excluding crosshair.

#### Parameters​

• addTopLayer?: boolean

`boolean`
if true, the top layer and primitives will be included in the screenshot (default: false)

• includeCrosshair?: boolean

`boolean`
works only if addTopLayer is enabled. If true, the crosshair will be included in the screenshot (default: false)

#### Returns​

HTMLCanvasElement

`HTMLCanvasElement`
A canvas with the chart drawn on. Any Canvas methods like toDataURL() or toBlob() can be used to serialize the result.

`Canvas`
`toDataURL()`
`toBlob()`
#### Inherited from​

IChartApiBase . takeScreenshot

`IChartApiBase`
`takeScreenshot`
### addPane()​

addPane(preserveEmptyPane?): IPaneApi <Time>

`preserveEmptyPane`
`IPaneApi`
`Time`
Add a pane to the chart

#### Parameters​

• preserveEmptyPane?: boolean

`boolean`
Whether to preserve the empty pane

#### Returns​

IPaneApi <Time>

`IPaneApi`
`Time`
The pane API

#### Inherited from​

IChartApiBase . addPane

`IChartApiBase`
`addPane`
### panes()​

panes(): IPaneApi <Time>[]

`IPaneApi`
`Time`
Returns array of panes' API

#### Returns​

IPaneApi <Time>[]

`IPaneApi`
`Time`
array of pane's Api

#### Inherited from​

IChartApiBase . panes

`IChartApiBase`
`panes`
### removePane()​

removePane(index): void

`index`
`void`
Removes a pane with index

#### Parameters​

• index: number

`number`
the pane to be removed

#### Returns​

void

`void`
#### Inherited from​

IChartApiBase . removePane

`IChartApiBase`
`removePane`
### swapPanes()​

swapPanes(first, second): void

`first`
`second`
`void`
swap the position of two panes.

#### Parameters​

• first: number

`number`
the first index

• second: number

`number`
the second index

#### Returns​

void

`void`
#### Inherited from​

IChartApiBase . swapPanes

`IChartApiBase`
`swapPanes`
### autoSizeActive()​

autoSizeActive(): boolean

`boolean`
Returns the active state of the autoSize option. This can be used to check
whether the chart is handling resizing automatically with a ResizeObserver.

`autoSize`
`ResizeObserver`
#### Returns​

boolean

`boolean`
Whether the autoSize option is enabled and the active.

`autoSize`
#### Inherited from​

IChartApiBase . autoSizeActive

`IChartApiBase`
`autoSizeActive`
### chartElement()​

chartElement(): HTMLDivElement

`HTMLDivElement`
Returns the generated div element containing the chart. This can be used for adding your own additional event listeners, or for measuring the
elements dimensions and position within the document.

#### Returns​

HTMLDivElement

`HTMLDivElement`
generated div element containing the chart.

#### Inherited from​

IChartApiBase . chartElement

`IChartApiBase`
`chartElement`
### setCrosshairPosition()​

setCrosshairPosition(price, horizontalPosition, seriesApi): void

`price`
`horizontalPosition`
`seriesApi`
`void`
Set the crosshair position within the chart.

Usually the crosshair position is set automatically by the user's actions. However in some cases you may want to set it explicitly.

For example if you want to synchronise the crosshairs of two separate charts.

#### Parameters​

• price: number

`number`
The price (vertical coordinate) of the new crosshair position.

• horizontalPosition: Time

`Time`
The horizontal coordinate (time by default) of the new crosshair position.

• seriesApi: ISeriesApi<keyof SeriesOptionsMap, Time, CustomData <Time> | WhitespaceData <Time> | AreaData <Time> | BarData <Time> | CandlestickData <Time> | BaselineData <Time> | LineData <Time> | HistogramData <Time> | CustomSeriesWhitespaceData <Time>, CustomSeriesOptions | AreaSeriesOptions | BarSeriesOptions | CandlestickSeriesOptions | BaselineSeriesOptions | LineSeriesOptions | HistogramSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon> | DeepPartial <BarStyleOptions & SeriesOptionsCommon> | DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon> | DeepPartial <BaselineStyleOptions & SeriesOptionsCommon> | DeepPartial <LineStyleOptions & SeriesOptionsCommon> | DeepPartial <HistogramStyleOptions & SeriesOptionsCommon> | DeepPartial <CustomStyleOptions & SeriesOptionsCommon>>

`ISeriesApi`
`SeriesOptionsMap`
`Time`
`CustomData`
`Time`
`WhitespaceData`
`Time`
`AreaData`
`Time`
`BarData`
`Time`
`CandlestickData`
`Time`
`BaselineData`
`Time`
`LineData`
`Time`
`HistogramData`
`Time`
`CustomSeriesWhitespaceData`
`Time`
`CustomSeriesOptions`
`AreaSeriesOptions`
`BarSeriesOptions`
`CandlestickSeriesOptions`
`BaselineSeriesOptions`
`LineSeriesOptions`
`HistogramSeriesOptions`
`DeepPartial`
`AreaStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`BarStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`CandlestickStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`BaselineStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`LineStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`HistogramStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`CustomStyleOptions`
`SeriesOptionsCommon`
#### Returns​

void

`void`
#### Inherited from​

IChartApiBase . setCrosshairPosition

`IChartApiBase`
`setCrosshairPosition`
### clearCrosshairPosition()​

clearCrosshairPosition(): void

`void`
Clear the crosshair position within the chart.

#### Returns​

void

`void`
#### Inherited from​

IChartApiBase . clearCrosshairPosition

`IChartApiBase`
`clearCrosshairPosition`
### paneSize()​

paneSize(paneIndex?): PaneSize

`paneIndex`
`PaneSize`
Returns the dimensions of the chart pane (the plot surface which excludes time and price scales).
This would typically only be useful for plugin development.

#### Parameters​

• paneIndex?: number

`number`
The index of the pane

#### Returns​

PaneSize

`PaneSize`
Dimensions of the chart pane

#### Inherited from​

IChartApiBase . paneSize

`IChartApiBase`
`paneSize`
#### Default Value​

0

`0`
### horzBehaviour()​

horzBehaviour(): IHorzScaleBehavior <Time>

`IHorzScaleBehavior`
`Time`
Returns the horizontal scale behaviour.

#### Returns​

IHorzScaleBehavior <Time>

`IHorzScaleBehavior`
`Time`
#### Inherited from​

IChartApiBase . horzBehaviour

`IChartApiBase`
`horzBehaviour`
- ExtendsMethodsapplyOptions()remove()resize()addCustomSeries()addSeries()removeSeries()subscribeClick()unsubscribeClick()subscribeDblClick()unsubscribeDblClick()subscribeCrosshairMove()unsubscribeCrosshairMove()priceScale()timeScale()options()takeScreenshot()addPane()panes()removePane()swapPanes()autoSizeActive()chartElement()setCrosshairPosition()clearCrosshairPosition()paneSize()horzBehaviour()

- applyOptions()remove()resize()addCustomSeries()addSeries()removeSeries()subscribeClick()unsubscribeClick()subscribeDblClick()unsubscribeDblClick()subscribeCrosshairMove()unsubscribeCrosshairMove()priceScale()timeScale()options()takeScreenshot()addPane()panes()removePane()swapPanes()autoSizeActive()chartElement()setCrosshairPosition()clearCrosshairPosition()paneSize()horzBehaviour()

---

# lightweight-charts docs api interfaces ISeriesApi

Represents the interface for interacting with series.

## Type parameters​

• TSeriesType extends SeriesType

`SeriesType`
• HorzScaleItem = Time

`Time`
• TData = SeriesDataItemTypeMap<HorzScaleItem>[TSeriesType]

`SeriesDataItemTypeMap`
`HorzScaleItem`
`TSeriesType`
• TOptions = SeriesOptionsMap[TSeriesType]

`SeriesOptionsMap`
`TSeriesType`
• TPartialOptions = SeriesPartialOptionsMap[TSeriesType]

`SeriesPartialOptionsMap`
`TSeriesType`
## Methods​

### priceFormatter()​

priceFormatter(): IPriceFormatter

`IPriceFormatter`
Returns current price formatter

#### Returns​

IPriceFormatter

`IPriceFormatter`
Interface to the price formatter object that can be used to format prices in the same way as the chart does

### priceToCoordinate()​

priceToCoordinate(price): Coordinate

`price`
`Coordinate`
Converts specified series price to pixel coordinate according to the series price scale

#### Parameters​

• price: number

`number`
Input price to be converted

#### Returns​

Coordinate

`Coordinate`
Pixel coordinate of the price level on the chart

### coordinateToPrice()​

coordinateToPrice(coordinate): BarPrice

`coordinate`
`BarPrice`
Converts specified coordinate to price value according to the series price scale

#### Parameters​

• coordinate: number

`number`
Input coordinate to be converted

#### Returns​

BarPrice

`BarPrice`
Price value of the coordinate on the chart

### barsInLogicalRange()​

barsInLogicalRange(range): BarsInfo<HorzScaleItem>

`range`
`BarsInfo`
`HorzScaleItem`
Returns bars information for the series in the provided logical range or null, if no series data has been found in the requested range.
This method can be used, for instance, to implement downloading historical data while scrolling to prevent a user from seeing empty space.

`null`
#### Parameters​

• range: IRange<number>

`IRange`
`number`
The logical range to retrieve info for.

#### Returns​

BarsInfo<HorzScaleItem>

`BarsInfo`
`HorzScaleItem`
The bars info for the given logical range.

#### Examples​

```text
const barsInfo = series.barsInLogicalRange(chart.timeScale().getVisibleLogicalRange());console.log(barsInfo);
```

```text
function onVisibleLogicalRangeChanged(newVisibleLogicalRange) {    const barsInfo = series.barsInLogicalRange(newVisibleLogicalRange);    // if there less than 50 bars to the left of the visible area    if (barsInfo !== null && barsInfo.barsBefore < 50) {        // try to load additional historical data and prepend it to the series data    }}chart.timeScale().subscribeVisibleLogicalRangeChange(onVisibleLogicalRangeChanged);
```

### applyOptions()​

applyOptions(options): void

`options`
`void`
Applies new options to the existing series
You can set options initially when you create series or use the applyOptions method of the series to change the existing options.
Note that you can only pass options you want to change.

`applyOptions`
#### Parameters​

• options: TPartialOptions

`TPartialOptions`
Any subset of options.

#### Returns​

void

`void`
### options()​

options(): Readonly<TOptions>

`Readonly`
`TOptions`
Returns currently applied options

#### Returns​

Readonly<TOptions>

`Readonly`
`TOptions`
Full set of currently applied options, including defaults

### priceScale()​

priceScale(): IPriceScaleApi

`IPriceScaleApi`
Returns the API interface for controlling the price scale that this series is currently attached to.

#### Returns​

IPriceScaleApi

`IPriceScaleApi`
IPriceScaleApi An interface for controlling the price scale (axis component) currently used by this series

#### Remarks​

Important: The returned PriceScaleApi is bound to the specific price scale (by ID and pane) that the series
is using at the time this method is called. If you later move the series to a different pane or attach it
to a different price scale (e.g., from 'right' to 'left'), the previously returned PriceScaleApi will NOT
follow the series. It will continue to control the original price scale it was created for.

To control the new price scale after moving a series, you must call this method again to get a fresh
PriceScaleApi instance for the current price scale.

### setData()​

setData(data): void

`data`
`void`
Sets or replaces series data.

#### Parameters​

• data: TData[]

`TData`
Ordered (earlier time point goes first) array of data items. Old data is fully replaced with the new one.

#### Returns​

void

`void`
#### Examples​

```text
lineSeries.setData([    { time: '2018-12-12', value: 24.11 },    { time: '2018-12-13', value: 31.74 },]);
```

```text
barSeries.setData([    { time: '2018-12-19', open: 141.77, high: 170.39, low: 120.25, close: 145.72 },    { time: '2018-12-20', open: 145.72, high: 147.99, low: 100.11, close: 108.19 },]);
```

### update()​

update(bar, historicalUpdate?): void

`bar`
`historicalUpdate`
`void`
Adds new data item to the existing set (or updates the latest item if times of the passed/latest items are equal).

#### Parameters​

• bar: TData

`TData`
A single data item to be added. Time of the new item must be greater or equal to the latest existing time point.
If the new item's time is equal to the last existing item's time, then the existing item is replaced with the new one.

• historicalUpdate?: boolean

`boolean`
If true, allows updating an existing data point that is not the latest bar. Default is false.
Updating older data using historicalUpdate will be slower than updating the most recent data point.

`historicalUpdate`
#### Returns​

void

`void`
#### Examples​

```text
lineSeries.update({    time: '2018-12-12',    value: 24.11,});
```

```text
barSeries.update({    time: '2018-12-19',    open: 141.77,    high: 170.39,    low: 120.25,    close: 145.72,});
```

### pop()​

pop(count): TData[]

`count`
`TData`
Removes one or more data items from the end of the series.

#### Parameters​

• count: number

`number`
The number of data items to remove.

#### Returns​

TData[]

`TData`
The removed data items.

#### Example​

```text
const removedData = lineSeries.pop(1);console.log(removedData);
```

### dataByIndex()​

dataByIndex(logicalIndex, mismatchDirection?): TData

`logicalIndex`
`mismatchDirection`
`TData`
Returns a bar data by provided logical index.

#### Parameters​

• logicalIndex: number

`number`
Logical index

• mismatchDirection?: MismatchDirection

`MismatchDirection`
Search direction if no data found at provided logical index.

#### Returns​

TData

`TData`
Original data item provided via setData or update methods.

#### Example​

```text
const originalData = series.dataByIndex(10, LightweightCharts.MismatchDirection.NearestLeft);
```

### data()​

data(): readonly TData[]

`TData`
Returns all the bar data for the series.

#### Returns​

readonly TData[]

`TData`
Original data items provided via setData or update methods.

#### Example​

```text
const originalData = series.data();
```

### subscribeDataChanged()​

subscribeDataChanged(handler): void

`handler`
`void`
Subscribe to the data changed event. This event is fired whenever the update or setData method is evoked
on the series.

`update`
`setData`
#### Parameters​

• handler: DataChangedHandler

`DataChangedHandler`
Handler to be called on a data changed event.

#### Returns​

void

`void`
#### Example​

```text
function myHandler() {    const data = series.data();    console.log(`The data has changed. New Data length: ${data.length}`);}series.subscribeDataChanged(myHandler);
```

### unsubscribeDataChanged()​

unsubscribeDataChanged(handler): void

`handler`
`void`
Unsubscribe a handler that was previously subscribed using subscribeDataChanged.

#### Parameters​

• handler: DataChangedHandler

`DataChangedHandler`
Previously subscribed handler

#### Returns​

void

`void`
#### Example​

```text
chart.unsubscribeDataChanged(myHandler);
```

### createPriceLine()​

createPriceLine(options): IPriceLine

`options`
`IPriceLine`
Creates a new price line

#### Parameters​

• options: CreatePriceLineOptions

`CreatePriceLineOptions`
Any subset of options, however price is required.

`price`
#### Returns​

IPriceLine

`IPriceLine`
#### Example​

```text
const priceLine = series.createPriceLine({    price: 80.0,    color: 'green',    lineWidth: 2,    lineStyle: LightweightCharts.LineStyle.Dotted,    axisLabelVisible: true,    title: 'P/L 500',});
```

### removePriceLine()​

removePriceLine(line): void

`line`
`void`
Removes the price line that was created before.

#### Parameters​

• line: IPriceLine

`IPriceLine`
A line to remove.

#### Returns​

void

`void`
#### Example​

```text
const priceLine = series.createPriceLine({ price: 80.0 });series.removePriceLine(priceLine);
```

### priceLines()​

priceLines(): IPriceLine[]

`IPriceLine`
Returns an array of price lines.

#### Returns​

IPriceLine[]

`IPriceLine`
### seriesType()​

seriesType(): TSeriesType

`TSeriesType`
Return current series type.

#### Returns​

TSeriesType

`TSeriesType`
Type of the series.

#### Example​

```text
const lineSeries = chart.addSeries(LineSeries);console.log(lineSeries.seriesType()); // "Line"const candlestickSeries = chart.addCandlestickSeries();console.log(candlestickSeries.seriesType()); // "Candlestick"
```

### lastValueData()​

lastValueData(globalLast): LastValueDataResult

`globalLast`
`LastValueDataResult`
Return the last value data of the series.

#### Parameters​

• globalLast: boolean

`boolean`
If false, get the last value in the current visible range. Otherwise, fetch the absolute last value

#### Returns​

LastValueDataResult

`LastValueDataResult`
The last value data of the series.

#### Example​

```text
const lineSeries = chart.addSeries(LineSeries);console.log(lineSeries.lastValueData(true)); // { noData: false, price: 24.11, color: '#000000' }const candlestickSeries = chart.addCandlestickSeries();console.log(candlestickSeries.lastValueData(false)); // { noData: false, price: 145.72, color: '#000000' }
```

### attachPrimitive()​

attachPrimitive(primitive): void

`primitive`
`void`
Attaches additional drawing primitive to the series

#### Parameters​

• primitive: ISeriesPrimitive<HorzScaleItem>

`ISeriesPrimitive`
`HorzScaleItem`
any implementation of ISeriesPrimitive interface

#### Returns​

void

`void`
### detachPrimitive()​

detachPrimitive(primitive): void

`primitive`
`void`
Detaches additional drawing primitive from the series

#### Parameters​

• primitive: ISeriesPrimitive<HorzScaleItem>

`ISeriesPrimitive`
`HorzScaleItem`
implementation of ISeriesPrimitive interface attached before
Does nothing if specified primitive was not attached

#### Returns​

void

`void`
### moveToPane()​

moveToPane(paneIndex): void

`paneIndex`
`void`
Move the series to another pane.

If the pane with the specified index does not exist, the pane will be created.

#### Parameters​

• paneIndex: number

`number`
The index of the pane. Should be a number between 0 and the total number of panes.

#### Returns​

void

`void`
### seriesOrder()​

seriesOrder(): number

`number`
Gets the zero-based index of this series within the list of all series on the current pane.

#### Returns​

number

`number`
The current index of the series in the pane's series collection.

### setSeriesOrder()​

setSeriesOrder(order): void

`order`
`void`
Sets the zero-based index of this series within the pane's series collection, thereby adjusting its rendering order.

Note:

- The chart may automatically recalculate this index after operations such as removing other series or moving this series to a different pane.

- If the provided index is less than 0, equal to, or greater than the number of series, it will be clamped to a valid range.

- Price scales derive their formatters from the series with the lowest index; changing the order may affect the price scale's formatting

#### Parameters​

• order: number

`number`
The desired zero-based index to set for this series within the pane.

#### Returns​

void

`void`
### getPane()​

getPane(): IPaneApi<HorzScaleItem>

`IPaneApi`
`HorzScaleItem`
Returns the pane to which the series is currently attached.

#### Returns​

IPaneApi<HorzScaleItem>

`IPaneApi`
`HorzScaleItem`
Pane API object to control the pane

- Type parametersMethodspriceFormatter()priceToCoordinate()coordinateToPrice()barsInLogicalRange()applyOptions()options()priceScale()setData()update()pop()dataByIndex()data()subscribeDataChanged()unsubscribeDataChanged()createPriceLine()removePriceLine()priceLines()seriesType()lastValueData()attachPrimitive()detachPrimitive()moveToPane()seriesOrder()setSeriesOrder()getPane()

- priceFormatter()priceToCoordinate()coordinateToPrice()barsInLogicalRange()applyOptions()options()priceScale()setData()update()pop()dataByIndex()data()subscribeDataChanged()unsubscribeDataChanged()createPriceLine()removePriceLine()priceLines()seriesType()lastValueData()attachPrimitive()detachPrimitive()moveToPane()seriesOrder()setSeriesOrder()getPane()

---

# lightweight-charts docs api functions createChart

createChart(container, options?): IChartApi

`container`
`options`
`IChartApi`
This function is the simplified main entry point of the Lightweight Charting Library with time points for the horizontal scale.

## Parameters​

• container: string | HTMLElement

`string`
`HTMLElement`
ID of HTML element or element itself

• options?: DeepPartial <TimeChartOptions>

`DeepPartial`
`TimeChartOptions`
Any subset of options to be applied at start.

## Returns​

IChartApi

`IChartApi`
An interface to the created chart

- ParametersReturns

---

# lightweight-charts docs series-types

This article describes supported series types and ways to customize them.

## Supported types​

### Area​

- Series Definition: AreaSeries

- Data format: SingleValueData or WhitespaceData

- Style options: a mix of SeriesOptionsCommon and AreaStyleOptions

`AreaSeries`
`SingleValueData`
`WhitespaceData`
`SeriesOptionsCommon`
`AreaStyleOptions`
This series is represented with a colored area between the time scale and line connecting all data points:

```text
const chartOptions = { layout: { textColor: 'black', background: { type: 'solid', color: 'white' } } };const chart = createChart(document.getElementById('container'), chartOptions);const areaSeries = chart.addSeries(AreaSeries, { lineColor: '#2962FF', topColor: '#2962FF', bottomColor: 'rgba(41, 98, 255, 0.28)' });const data = [{ value: 0, time: 1642425322 }, { value: 8, time: 1642511722 }, { value: 10, time: 1642598122 }, { value: 20, time: 1642684522 }, { value: 3, time: 1642770922 }, { value: 43, time: 1642857322 }, { value: 41, time: 1642943722 }, { value: 43, time: 1643030122 }, { value: 56, time: 1643116522 }, { value: 46, time: 1643202922 }];areaSeries.setData(data);chart.timeScale().fitContent();
```

### Bar​

- Series Definition: BarSeries

- Data format: BarData or WhitespaceData

- Style options: a mix of SeriesOptionsCommon and BarStyleOptions

`BarSeries`
`BarData`
`WhitespaceData`
`SeriesOptionsCommon`
`BarStyleOptions`
This series illustrates price movements with vertical bars.
The length of each bar corresponds to the range between the highest and lowest price values.
Open and close values are represented with the tick marks on the left and right side of the bar, respectively:

```text
const chartOptions = { layout: { textColor: 'black', background: { type: 'solid', color: 'white' } } };const chart = createChart(document.getElementById('container'), chartOptions);const barSeries = chart.addSeries(BarSeries, { upColor: '#26a69a', downColor: '#ef5350' });const data = [  { open: 10, high: 10.63, low: 9.49, close: 9.55, time: 1642427876 },  { open: 9.55, high: 10.30, low: 9.42, close: 9.94, time: 1642514276 },  { open: 9.94, high: 10.17, low: 9.92, close: 9.78, time: 1642600676 },  { open: 9.78, high: 10.59, low: 9.18, close: 9.51, time: 1642687076 },  { open: 9.51, high: 10.46, low: 9.10, close: 10.17, time: 1642773476 },  { open: 10.17, high: 10.96, low: 10.16, close: 10.47, time: 1642859876 },  { open: 10.47, high: 11.39, low: 10.40, close: 10.81, time: 1642946276 },  { open: 10.81, high: 11.60, low: 10.30, close: 10.75, time: 1643032676 },  { open: 10.75, high: 11.60, low: 10.49, close: 10.93, time: 1643119076 },  { open: 10.93, high: 11.53, low: 10.76, close: 10.96, time: 1643205476 },  { open: 10.96, high: 11.90, low: 10.80, close: 11.50, time: 1643291876 },  { open: 11.50, high: 12.00, low: 11.30, close: 11.80, time: 1643378276 },  { open: 11.80, high: 12.20, low: 11.70, close: 12.00, time: 1643464676 },  { open: 12.00, high: 12.50, low: 11.90, close: 12.30, time: 1643551076 },  { open: 12.30, high: 12.80, low: 12.10, close: 12.60, time: 1643637476 },  { open: 12.60, high: 13.00, low: 12.50, close: 12.90, time: 1643723876 },  { open: 12.90, high: 13.50, low: 12.70, close: 13.20, time: 1643810276 },  { open: 13.20, high: 13.70, low: 13.00, close: 13.50, time: 1643896676 },  { open: 13.50, high: 14.00, low: 13.30, close: 13.80, time: 1643983076 },  { open: 13.80, high: 14.20, low: 13.60, close: 14.00, time: 1644069476 },];barSeries.setData(data);chart.timeScale().fitContent();
```

### Baseline​

- Series Definition: BaselineSeries

- Data format: SingleValueData or WhitespaceData

- Style options: a mix of SeriesOptionsCommon and BaselineStyleOptions

`BaselineSeries`
`SingleValueData`
`WhitespaceData`
`SeriesOptionsCommon`
`BaselineStyleOptions`
This series is represented with two colored areas between the the base value line and line connecting all data points:

```text
const chartOptions = { layout: { textColor: 'black', background: { type: 'solid', color: 'white' } } };const chart = createChart(document.getElementById('container'), chartOptions);const baselineSeries = chart.addSeries(BaselineSeries, { baseValue: { type: 'price', price: 25 }, topLineColor: 'rgba( 38, 166, 154, 1)', topFillColor1: 'rgba( 38, 166, 154, 0.28)', topFillColor2: 'rgba( 38, 166, 154, 0.05)', bottomLineColor: 'rgba( 239, 83, 80, 1)', bottomFillColor1: 'rgba( 239, 83, 80, 0.05)', bottomFillColor2: 'rgba( 239, 83, 80, 0.28)' });const data = [{ value: 1, time: 1642425322 }, { value: 8, time: 1642511722 }, { value: 10, time: 1642598122 }, { value: 20, time: 1642684522 }, { value: 3, time: 1642770922 }, { value: 43, time: 1642857322 }, { value: 41, time: 1642943722 }, { value: 43, time: 1643030122 }, { value: 56, time: 1643116522 }, { value: 46, time: 1643202922 }];baselineSeries.setData(data);chart.timeScale().fitContent();
```

### Candlestick​

- Series Definition: CandlestickSeries

- Data format: CandlestickData or WhitespaceData

- Style options: a mix of SeriesOptionsCommon and CandlestickStyleOptions

`CandlestickSeries`
`CandlestickData`
`WhitespaceData`
`SeriesOptionsCommon`
`CandlestickStyleOptions`
This series illustrates price movements with candlesticks.
The solid body of each candlestick represents the open and close values for the time period. Vertical lines, known as wicks, above and below the candle body represent the high and low values, respectively:

```text
const chartOptions = { layout: { textColor: 'black', background: { type: 'solid', color: 'white' } } };const chart = createChart(document.getElementById('container'), chartOptions);const candlestickSeries = chart.addSeries(CandlestickSeries, { upColor: '#26a69a', downColor: '#ef5350', borderVisible: false, wickUpColor: '#26a69a', wickDownColor: '#ef5350' });const data = [{ open: 10, high: 10.63, low: 9.49, close: 9.55, time: 1642427876 }, { open: 9.55, high: 10.30, low: 9.42, close: 9.94, time: 1642514276 }, { open: 9.94, high: 10.17, low: 9.92, close: 9.78, time: 1642600676 }, { open: 9.78, high: 10.59, low: 9.18, close: 9.51, time: 1642687076 }, { open: 9.51, high: 10.46, low: 9.10, close: 10.17, time: 1642773476 }, { open: 10.17, high: 10.96, low: 10.16, close: 10.47, time: 1642859876 }, { open: 10.47, high: 11.39, low: 10.40, close: 10.81, time: 1642946276 }, { open: 10.81, high: 11.60, low: 10.30, close: 10.75, time: 1643032676 }, { open: 10.75, high: 11.60, low: 10.49, close: 10.93, time: 1643119076 }, { open: 10.93, high: 11.53, low: 10.76, close: 10.96, time: 1643205476 }];candlestickSeries.setData(data);chart.timeScale().fitContent();
```

### Histogram​

- Series Definition: HistogramSeries

- Data format: HistogramData or WhitespaceData

- Style options: a mix of SeriesOptionsCommon and HistogramStyleOptions

`HistogramSeries`
`HistogramData`
`WhitespaceData`
`SeriesOptionsCommon`
`HistogramStyleOptions`
This series illustrates the distribution of values with columns:

```text
const chartOptions = { layout: { textColor: 'black', background: { type: 'solid', color: 'white' } } };const chart = createChart(document.getElementById('container'), chartOptions);const histogramSeries = chart.addSeries(HistogramSeries, { color: '#26a69a' });const data = [{ value: 1, time: 1642425322 }, { value: 8, time: 1642511722 }, { value: 10, time: 1642598122 }, { value: 20, time: 1642684522 }, { value: 3, time: 1642770922, color: 'red' }, { value: 43, time: 1642857322 }, { value: 41, time: 1642943722, color: 'red' }, { value: 43, time: 1643030122 }, { value: 56, time: 1643116522 }, { value: 46, time: 1643202922, color: 'red' }];histogramSeries.setData(data);chart.timeScale().fitContent();
```

### Line​

- Series Definition: LineSeries

- Data format: LineData or WhitespaceData

- Style options: a mix of SeriesOptionsCommon and LineStyleOptions

`LineSeries`
`LineData`
`WhitespaceData`
`SeriesOptionsCommon`
`LineStyleOptions`
This series is represented with a set of data points connected by straight line segments:

```text
const chartOptions = { layout: { textColor: 'black', background: { type: 'solid', color: 'white' } } };const chart = createChart(document.getElementById('container'), chartOptions);const lineSeries = chart.addSeries(LineSeries, { color: '#2962FF' });const data = [{ value: 0, time: 1642425322 }, { value: 8, time: 1642511722 }, { value: 10, time: 1642598122 }, { value: 20, time: 1642684522 }, { value: 3, time: 1642770922 }, { value: 43, time: 1642857322 }, { value: 41, time: 1642943722 }, { value: 43, time: 1643030122 }, { value: 56, time: 1643116522 }, { value: 46, time: 1643202922 }];lineSeries.setData(data);chart.timeScale().fitContent();
```

### Custom series (plugins)​

The library enables you to create custom series types, also known as series plugins, to expand its functionality. With this feature, you can add new series types, indicators, and other visualizations.

To define a custom series type, create a class that implements the ICustomSeriesPaneView interface. This class defines the rendering code that Lightweight Charts™ uses to draw the series on the chart.
Once your custom series type is defined, it can be added to any chart instance using the addCustomSeries() method. Custom series types function like any other series.

`ICustomSeriesPaneView`
`addCustomSeries()`
For more information, refer to the Plugins article.

## Customization​

Each series type offers a unique set of customization options listed on the SeriesStyleOptionsMap page.

`SeriesStyleOptionsMap`
You can adjust series options in two ways:

- Specify the default options using the corresponding parameter while creating a series:
// Change default top & bottom colors of an area series in creating timeconst series = chart.addSeries(AreaSeries, {    topColor: 'red',    bottomColor: 'green',});

- Use the ISeriesApi.applyOptions method to apply other options on the fly:
// Updating candlestick series options on the flycandlestickSeries.applyOptions({    upColor: 'red',    downColor: 'blue',});

Specify the default options using the corresponding parameter while creating a series:

```text
// Change default top & bottom colors of an area series in creating timeconst series = chart.addSeries(AreaSeries, {    topColor: 'red',    bottomColor: 'green',});
```

Use the ISeriesApi.applyOptions method to apply other options on the fly:

`ISeriesApi.applyOptions`
```text
// Updating candlestick series options on the flycandlestickSeries.applyOptions({    upColor: 'red',    downColor: 'blue',});
```

- Supported typesAreaBarBaselineCandlestickHistogramLineCustom series (plugins)Customization

- AreaBarBaselineCandlestickHistogramLineCustom series (plugins)

---

# lightweight-charts docs api interfaces ITimeScaleApi

Interface to chart time scale

## Type parameters​

• HorzScaleItem

## Methods​

### scrollPosition()​

scrollPosition(): number

`number`
Return the distance from the right edge of the time scale to the lastest bar of the series measured in bars.

#### Returns​

number

`number`
### scrollToPosition()​

scrollToPosition(position, animated): void

`position`
`animated`
`void`
Scrolls the chart to the specified position.

#### Parameters​

• position: number

`number`
Target data position

• animated: boolean

`boolean`
Setting this to true makes the chart scrolling smooth and adds animation

#### Returns​

void

`void`
### scrollToRealTime()​

scrollToRealTime(): void

`void`
Restores default scroll position of the chart. This process is always animated.

#### Returns​

void

`void`
### getVisibleRange()​

getVisibleRange(): IRange<HorzScaleItem>

`IRange`
`HorzScaleItem`
Returns current visible time range of the chart.

Note that this method cannot extrapolate time and will use the only currently existent data.
To get complete information about current visible range, please use getVisibleLogicalRange and ISeriesApi.barsInLogicalRange.

#### Returns​

IRange<HorzScaleItem>

`IRange`
`HorzScaleItem`
Visible range or null if the chart has no data at all.

### setVisibleRange()​

setVisibleRange(range): void

`range`
`void`
Sets visible range of data.

Note that this method cannot extrapolate time and will use the only currently existent data.
Thus, for example, if currently a chart doesn't have data prior 2018-01-01 date and you set visible range with from date 2016-01-01, it will be automatically adjusted to 2018-01-01 (and the same for to date).

`2018-01-01`
`from`
`2016-01-01`
`2018-01-01`
`to`
But if you can approximate indexes on your own - you could use setVisibleLogicalRange instead.

#### Parameters​

• range: IRange<HorzScaleItem>

`IRange`
`HorzScaleItem`
Target visible range of data.

#### Returns​

void

`void`
#### Example​

```text
chart.timeScale().setVisibleRange({    from: (new Date(Date.UTC(2018, 0, 1, 0, 0, 0, 0))).getTime() / 1000,    to: (new Date(Date.UTC(2018, 1, 1, 0, 0, 0, 0))).getTime() / 1000,});
```

### getVisibleLogicalRange()​

getVisibleLogicalRange(): LogicalRange

`LogicalRange`
Returns the current visible logical range of the chart as an object with the first and last time points of the logical range, or returns null if the chart has no data.

`null`
#### Returns​

LogicalRange

`LogicalRange`
Visible range or null if the chart has no data at all.

### setVisibleLogicalRange()​

setVisibleLogicalRange(range): void

`range`
`void`
Sets visible logical range of data.

#### Parameters​

• range: IRange<number>

`IRange`
`number`
Target visible logical range of data.

#### Returns​

void

`void`
#### Example​

```text
chart.timeScale().setVisibleLogicalRange({ from: 0, to: 10 });
```

### resetTimeScale()​

resetTimeScale(): void

`void`
Restores default zoom level and scroll position of the time scale.

#### Returns​

void

`void`
### fitContent()​

fitContent(): void

`void`
Automatically calculates the visible range to fit all data from all series.

#### Returns​

void

`void`
### logicalToCoordinate()​

logicalToCoordinate(logical): Coordinate

`logical`
`Coordinate`
Converts a logical index to local x coordinate.

#### Parameters​

• logical: Logical

`Logical`
Logical index needs to be converted

#### Returns​

Coordinate

`Coordinate`
x coordinate of that time or null if the chart doesn't have data

`null`
### coordinateToLogical()​

coordinateToLogical(x): Logical

`x`
`Logical`
Converts a coordinate to logical index.

#### Parameters​

• x: number

`number`
Coordinate needs to be converted

#### Returns​

Logical

`Logical`
Logical index that is located on that coordinate or null if the chart doesn't have data

`null`
### timeToIndex()​

timeToIndex(time, findNearest?): TimePointIndex

`time`
`findNearest`
`TimePointIndex`
Converts a time to local x coordinate.

#### Parameters​

• time: HorzScaleItem

`HorzScaleItem`
Time needs to be converted

• findNearest?: boolean

`boolean`
#### Returns​

TimePointIndex

`TimePointIndex`
X coordinate of that time or null if no time found on time scale

`null`
### timeToCoordinate()​

timeToCoordinate(time): Coordinate

`time`
`Coordinate`
Converts a time to local x coordinate.

#### Parameters​

• time: HorzScaleItem

`HorzScaleItem`
Time needs to be converted

#### Returns​

Coordinate

`Coordinate`
X coordinate of that time or null if no time found on time scale

`null`
### coordinateToTime()​

coordinateToTime(x): HorzScaleItem

`x`
`HorzScaleItem`
Converts a coordinate to time.

#### Parameters​

• x: number

`number`
Coordinate needs to be converted.

#### Returns​

HorzScaleItem

`HorzScaleItem`
Time of a bar that is located on that coordinate or null if there are no bars found on that coordinate.

`null`
### width()​

width(): number

`number`
Returns a width of the time scale.

#### Returns​

number

`number`
### height()​

height(): number

`number`
Returns a height of the time scale.

#### Returns​

number

`number`
### subscribeVisibleTimeRangeChange()​

subscribeVisibleTimeRangeChange(handler): void

`handler`
`void`
Subscribe to the visible time range change events.

The argument passed to the handler function is an object with from and to properties of type Time, or null if there is no visible data.

`from`
`to`
`null`
#### Parameters​

• handler: TimeRangeChangeEventHandler<HorzScaleItem>

`TimeRangeChangeEventHandler`
`HorzScaleItem`
Handler (function) to be called when the visible indexes change.

#### Returns​

void

`void`
#### Example​

```text
function myVisibleTimeRangeChangeHandler(newVisibleTimeRange) {    if (newVisibleTimeRange === null) {        // handle null    }    // handle new logical range}chart.timeScale().subscribeVisibleTimeRangeChange(myVisibleTimeRangeChangeHandler);
```

### unsubscribeVisibleTimeRangeChange()​

unsubscribeVisibleTimeRangeChange(handler): void

`handler`
`void`
Unsubscribe a handler that was previously subscribed using subscribeVisibleTimeRangeChange.

#### Parameters​

• handler: TimeRangeChangeEventHandler<HorzScaleItem>

`TimeRangeChangeEventHandler`
`HorzScaleItem`
Previously subscribed handler

#### Returns​

void

`void`
#### Example​

```text
chart.timeScale().unsubscribeVisibleTimeRangeChange(myVisibleTimeRangeChangeHandler);
```

### subscribeVisibleLogicalRangeChange()​

subscribeVisibleLogicalRangeChange(handler): void

`handler`
`void`
Subscribe to the visible logical range change events.

The argument passed to the handler function is an object with from and to properties of type number, or null if there is no visible data.

`from`
`to`
`number`
`null`
#### Parameters​

• handler: LogicalRangeChangeEventHandler

`LogicalRangeChangeEventHandler`
Handler (function) to be called when the visible indexes change.

#### Returns​

void

`void`
#### Example​

```text
function myVisibleLogicalRangeChangeHandler(newVisibleLogicalRange) {    if (newVisibleLogicalRange === null) {        // handle null    }    // handle new logical range}chart.timeScale().subscribeVisibleLogicalRangeChange(myVisibleLogicalRangeChangeHandler);
```

### unsubscribeVisibleLogicalRangeChange()​

unsubscribeVisibleLogicalRangeChange(handler): void

`handler`
`void`
Unsubscribe a handler that was previously subscribed using subscribeVisibleLogicalRangeChange.

#### Parameters​

• handler: LogicalRangeChangeEventHandler

`LogicalRangeChangeEventHandler`
Previously subscribed handler

#### Returns​

void

`void`
#### Example​

```text
chart.timeScale().unsubscribeVisibleLogicalRangeChange(myVisibleLogicalRangeChangeHandler);
```

### subscribeSizeChange()​

subscribeSizeChange(handler): void

`handler`
`void`
Adds a subscription to time scale size changes

#### Parameters​

• handler: SizeChangeEventHandler

`SizeChangeEventHandler`
Handler (function) to be called when the time scale size changes

#### Returns​

void

`void`
### unsubscribeSizeChange()​

unsubscribeSizeChange(handler): void

`handler`
`void`
Removes a subscription to time scale size changes

#### Parameters​

• handler: SizeChangeEventHandler

`SizeChangeEventHandler`
Previously subscribed handler

#### Returns​

void

`void`
### applyOptions()​

applyOptions(options): void

`options`
`void`
Applies new options to the time scale.

#### Parameters​

• options: DeepPartial <HorzScaleOptions>

`DeepPartial`
`HorzScaleOptions`
Any subset of options.

#### Returns​

void

`void`
### options()​

options(): Readonly <HorzScaleOptions>

`Readonly`
`HorzScaleOptions`
Returns current options

#### Returns​

Readonly <HorzScaleOptions>

`Readonly`
`HorzScaleOptions`
Currently applied options

- Type parametersMethodsscrollPosition()scrollToPosition()scrollToRealTime()getVisibleRange()setVisibleRange()getVisibleLogicalRange()setVisibleLogicalRange()resetTimeScale()fitContent()logicalToCoordinate()coordinateToLogical()timeToIndex()timeToCoordinate()coordinateToTime()width()height()subscribeVisibleTimeRangeChange()unsubscribeVisibleTimeRangeChange()subscribeVisibleLogicalRangeChange()unsubscribeVisibleLogicalRangeChange()subscribeSizeChange()unsubscribeSizeChange()applyOptions()options()

- scrollPosition()scrollToPosition()scrollToRealTime()getVisibleRange()setVisibleRange()getVisibleLogicalRange()setVisibleLogicalRange()resetTimeScale()fitContent()logicalToCoordinate()coordinateToLogical()timeToIndex()timeToCoordinate()coordinateToTime()width()height()subscribeVisibleTimeRangeChange()unsubscribeVisibleTimeRangeChange()subscribeVisibleLogicalRangeChange()unsubscribeVisibleLogicalRangeChange()subscribeSizeChange()unsubscribeSizeChange()applyOptions()options()

---

# lightweight-charts docs api type-aliases LineSeriesOptions

LineSeriesOptions: SeriesOptions <LineStyleOptions>

`SeriesOptions`
`LineStyleOptions`
Represents line series options.

---

# lightweight-charts docs api interfaces SeriesOptionsMap

Represents the type of options for each series type.

For example a bar series has options represented by BarSeriesOptions.

## Properties​

### Bar​

Bar: BarSeriesOptions

`BarSeriesOptions`
The type of bar series options.

### Candlestick​

Candlestick: CandlestickSeriesOptions

`CandlestickSeriesOptions`
The type of candlestick series options.

### Area​

Area: AreaSeriesOptions

`AreaSeriesOptions`
The type of area series options.

### Baseline​

Baseline: BaselineSeriesOptions

`BaselineSeriesOptions`
The type of baseline series options.

### Line​

Line: LineSeriesOptions

`LineSeriesOptions`
The type of line series options.

### Histogram​

Histogram: HistogramSeriesOptions

`HistogramSeriesOptions`
The type of histogram series options.

### Custom​

Custom: CustomSeriesOptions

`CustomSeriesOptions`
The type of a custom series options.

- PropertiesBarCandlestickAreaBaselineLineHistogramCustom

- BarCandlestickAreaBaselineLineHistogramCustom

---

# lightweight-charts docs api interfaces SeriesDataItemTypeMap

Represents the type of data that a series contains.

For example a bar series contains BarData or WhitespaceData.

## Type parameters​

• HorzScaleItem = Time

`Time`
## Properties​

### Bar​

Bar: WhitespaceData<HorzScaleItem> | BarData<HorzScaleItem>

`WhitespaceData`
`HorzScaleItem`
`BarData`
`HorzScaleItem`
The types of bar series data.

### Candlestick​

Candlestick: WhitespaceData<HorzScaleItem> | CandlestickData<HorzScaleItem>

`WhitespaceData`
`HorzScaleItem`
`CandlestickData`
`HorzScaleItem`
The types of candlestick series data.

### Area​

Area: AreaData<HorzScaleItem> | WhitespaceData<HorzScaleItem>

`AreaData`
`HorzScaleItem`
`WhitespaceData`
`HorzScaleItem`
The types of area series data.

### Baseline​

Baseline: WhitespaceData<HorzScaleItem> | BaselineData<HorzScaleItem>

`WhitespaceData`
`HorzScaleItem`
`BaselineData`
`HorzScaleItem`
The types of baseline series data.

### Line​

Line: WhitespaceData<HorzScaleItem> | LineData<HorzScaleItem>

`WhitespaceData`
`HorzScaleItem`
`LineData`
`HorzScaleItem`
The types of line series data.

### Histogram​

Histogram: WhitespaceData<HorzScaleItem> | HistogramData<HorzScaleItem>

`WhitespaceData`
`HorzScaleItem`
`HistogramData`
`HorzScaleItem`
The types of histogram series data.

### Custom​

Custom: CustomData<HorzScaleItem> | CustomSeriesWhitespaceData<HorzScaleItem>

`CustomData`
`HorzScaleItem`
`CustomSeriesWhitespaceData`
`HorzScaleItem`
The base types of an custom series data.

- Type parametersPropertiesBarCandlestickAreaBaselineLineHistogramCustom

- BarCandlestickAreaBaselineLineHistogramCustom

---

# lightweight-charts docs api interfaces IChartApiBase

The main interface of a single chart.

## Extended by​

- IChartApi

`IChartApi`
## Type parameters​

• HorzScaleItem = Time

`Time`
## Methods​

### remove()​

remove(): void

`void`
Removes the chart object including all DOM elements. This is an irreversible operation, you cannot do anything with the chart after removing it.

#### Returns​

void

`void`
### resize()​

resize(width, height, forceRepaint?): void

`width`
`height`
`forceRepaint`
`void`
Sets fixed size of the chart. By default chart takes up 100% of its container.

If chart has the autoSize option enabled, and the ResizeObserver is available then
the width and height values will be ignored.

`autoSize`
#### Parameters​

• width: number

`number`
Target width of the chart.

• height: number

`number`
Target height of the chart.

• forceRepaint?: boolean

`boolean`
True to initiate resize immediately. One could need this to get screenshot immediately after resize.

#### Returns​

void

`void`
### addCustomSeries()​

addCustomSeries<TData, TOptions, TPartialOptions>(customPaneView, customOptions?, paneIndex?): ISeriesApi<"Custom", HorzScaleItem, TData | WhitespaceData<HorzScaleItem>, TOptions, TPartialOptions>

`TData`
`TOptions`
`TPartialOptions`
`customPaneView`
`customOptions`
`paneIndex`
`ISeriesApi`
`"Custom"`
`HorzScaleItem`
`TData`
`WhitespaceData`
`HorzScaleItem`
`TOptions`
`TPartialOptions`
Creates a custom series with specified parameters.

A custom series is a generic series which can be extended with a custom renderer to
implement chart types which the library doesn't support by default.

#### Type parameters​

• TData extends CustomData<HorzScaleItem>

`CustomData`
`HorzScaleItem`
• TOptions extends CustomSeriesOptions

`CustomSeriesOptions`
• TPartialOptions extends DeepPartial<TOptions & SeriesOptionsCommon> = DeepPartial<TOptions & SeriesOptionsCommon>

`DeepPartial`
`TOptions`
`SeriesOptionsCommon`
`DeepPartial`
`TOptions`
`SeriesOptionsCommon`
#### Parameters​

• customPaneView: ICustomSeriesPaneView<HorzScaleItem, TData, TOptions>

`ICustomSeriesPaneView`
`HorzScaleItem`
`TData`
`TOptions`
A custom series pane view which implements the custom renderer.

• customOptions?: DeepPartial<TOptions & SeriesOptionsCommon>

`DeepPartial`
`TOptions`
`SeriesOptionsCommon`
Customization parameters of the series being created.

```text
const series = chart.addCustomSeries(myCustomPaneView);
```

• paneIndex?: number

`number`
#### Returns​

ISeriesApi<"Custom", HorzScaleItem, TData | WhitespaceData<HorzScaleItem>, TOptions, TPartialOptions>

`ISeriesApi`
`"Custom"`
`HorzScaleItem`
`TData`
`WhitespaceData`
`HorzScaleItem`
`TOptions`
`TPartialOptions`
### addSeries()​

addSeries<T>(definition, options?, paneIndex?): ISeriesApi<T, HorzScaleItem, SeriesDataItemTypeMap<HorzScaleItem>[T], SeriesOptionsMap[T], SeriesPartialOptionsMap[T]>

`T`
`definition`
`options`
`paneIndex`
`ISeriesApi`
`T`
`HorzScaleItem`
`SeriesDataItemTypeMap`
`HorzScaleItem`
`T`
`SeriesOptionsMap`
`T`
`SeriesPartialOptionsMap`
`T`
Creates a series with specified parameters.

#### Type parameters​

• T extends keyof SeriesOptionsMap

`SeriesOptionsMap`
#### Parameters​

• definition: SeriesDefinition<T>

`SeriesDefinition`
`T`
A series definition.

• options?: SeriesPartialOptionsMap[T]

`SeriesPartialOptionsMap`
`T`
Customization parameters of the series being created.

• paneIndex?: number

`number`
An index of the pane where the series should be created.

```text
const series = chart.addSeries(LineSeries, { lineWidth: 2 });
```

#### Returns​

ISeriesApi<T, HorzScaleItem, SeriesDataItemTypeMap<HorzScaleItem>[T], SeriesOptionsMap[T], SeriesPartialOptionsMap[T]>

`ISeriesApi`
`T`
`HorzScaleItem`
`SeriesDataItemTypeMap`
`HorzScaleItem`
`T`
`SeriesOptionsMap`
`T`
`SeriesPartialOptionsMap`
`T`
### removeSeries()​

removeSeries(seriesApi): void

`seriesApi`
`void`
Removes a series of any type. This is an irreversible operation, you cannot do anything with the series after removing it.

#### Parameters​

• seriesApi: ISeriesApi<keyof SeriesOptionsMap, HorzScaleItem, CustomData<HorzScaleItem> | WhitespaceData<HorzScaleItem> | AreaData<HorzScaleItem> | BarData<HorzScaleItem> | CandlestickData<HorzScaleItem> | BaselineData<HorzScaleItem> | LineData<HorzScaleItem> | HistogramData<HorzScaleItem> | CustomSeriesWhitespaceData<HorzScaleItem>, CustomSeriesOptions | AreaSeriesOptions | BarSeriesOptions | CandlestickSeriesOptions | BaselineSeriesOptions | LineSeriesOptions | HistogramSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon> | DeepPartial <BarStyleOptions & SeriesOptionsCommon> | DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon> | DeepPartial <BaselineStyleOptions & SeriesOptionsCommon> | DeepPartial <LineStyleOptions & SeriesOptionsCommon> | DeepPartial <HistogramStyleOptions & SeriesOptionsCommon> | DeepPartial <CustomStyleOptions & SeriesOptionsCommon>>

`ISeriesApi`
`SeriesOptionsMap`
`HorzScaleItem`
`CustomData`
`HorzScaleItem`
`WhitespaceData`
`HorzScaleItem`
`AreaData`
`HorzScaleItem`
`BarData`
`HorzScaleItem`
`CandlestickData`
`HorzScaleItem`
`BaselineData`
`HorzScaleItem`
`LineData`
`HorzScaleItem`
`HistogramData`
`HorzScaleItem`
`CustomSeriesWhitespaceData`
`HorzScaleItem`
`CustomSeriesOptions`
`AreaSeriesOptions`
`BarSeriesOptions`
`CandlestickSeriesOptions`
`BaselineSeriesOptions`
`LineSeriesOptions`
`HistogramSeriesOptions`
`DeepPartial`
`AreaStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`BarStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`CandlestickStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`BaselineStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`LineStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`HistogramStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`CustomStyleOptions`
`SeriesOptionsCommon`
#### Returns​

void

`void`
#### Example​

```text
chart.removeSeries(series);
```

### subscribeClick()​

subscribeClick(handler): void

`handler`
`void`
Subscribe to the chart click event.

#### Parameters​

• handler: MouseEventHandler<HorzScaleItem>

`MouseEventHandler`
`HorzScaleItem`
Handler to be called on mouse click.

#### Returns​

void

`void`
#### Example​

```text
function myClickHandler(param) {    if (!param.point) {        return;    }    console.log(`Click at ${param.point.x}, ${param.point.y}. The time is ${param.time}.`);}chart.subscribeClick(myClickHandler);
```

### unsubscribeClick()​

unsubscribeClick(handler): void

`handler`
`void`
Unsubscribe a handler that was previously subscribed using subscribeClick.

#### Parameters​

• handler: MouseEventHandler<HorzScaleItem>

`MouseEventHandler`
`HorzScaleItem`
Previously subscribed handler

#### Returns​

void

`void`
#### Example​

```text
chart.unsubscribeClick(myClickHandler);
```

### subscribeDblClick()​

subscribeDblClick(handler): void

`handler`
`void`
Subscribe to the chart double-click event.

#### Parameters​

• handler: MouseEventHandler<HorzScaleItem>

`MouseEventHandler`
`HorzScaleItem`
Handler to be called on mouse double-click.

#### Returns​

void

`void`
#### Example​

```text
function myDblClickHandler(param) {    if (!param.point) {        return;    }    console.log(`Double Click at ${param.point.x}, ${param.point.y}. The time is ${param.time}.`);}chart.subscribeDblClick(myDblClickHandler);
```

### unsubscribeDblClick()​

unsubscribeDblClick(handler): void

`handler`
`void`
Unsubscribe a handler that was previously subscribed using subscribeDblClick.

#### Parameters​

• handler: MouseEventHandler<HorzScaleItem>

`MouseEventHandler`
`HorzScaleItem`
Previously subscribed handler

#### Returns​

void

`void`
#### Example​

```text
chart.unsubscribeDblClick(myDblClickHandler);
```

### subscribeCrosshairMove()​

subscribeCrosshairMove(handler): void

`handler`
`void`
Subscribe to the crosshair move event.

#### Parameters​

• handler: MouseEventHandler<HorzScaleItem>

`MouseEventHandler`
`HorzScaleItem`
Handler to be called on crosshair move.

#### Returns​

void

`void`
#### Example​

```text
function myCrosshairMoveHandler(param) {    if (!param.point) {        return;    }    console.log(`Crosshair moved to ${param.point.x}, ${param.point.y}. The time is ${param.time}.`);}chart.subscribeCrosshairMove(myCrosshairMoveHandler);
```

### unsubscribeCrosshairMove()​

unsubscribeCrosshairMove(handler): void

`handler`
`void`
Unsubscribe a handler that was previously subscribed using subscribeCrosshairMove.

#### Parameters​

• handler: MouseEventHandler<HorzScaleItem>

`MouseEventHandler`
`HorzScaleItem`
Previously subscribed handler

#### Returns​

void

`void`
#### Example​

```text
chart.unsubscribeCrosshairMove(myCrosshairMoveHandler);
```

### priceScale()​

priceScale(priceScaleId, paneIndex?): IPriceScaleApi

`priceScaleId`
`paneIndex`
`IPriceScaleApi`
Returns API to manipulate a price scale.

#### Parameters​

• priceScaleId: string

`string`
ID of the price scale.

• paneIndex?: number

`number`
Index of the pane (default: 0)

#### Returns​

IPriceScaleApi

`IPriceScaleApi`
Price scale API.

### timeScale()​

timeScale(): ITimeScaleApi<HorzScaleItem>

`ITimeScaleApi`
`HorzScaleItem`
Returns API to manipulate the time scale

#### Returns​

ITimeScaleApi<HorzScaleItem>

`ITimeScaleApi`
`HorzScaleItem`
Target API

### applyOptions()​

applyOptions(options): void

`options`
`void`
Applies new options to the chart

#### Parameters​

• options: DeepPartial <ChartOptionsImpl<HorzScaleItem>>

`DeepPartial`
`ChartOptionsImpl`
`HorzScaleItem`
Any subset of options.

#### Returns​

void

`void`
### options()​

options(): Readonly <ChartOptionsImpl<HorzScaleItem>>

`Readonly`
`ChartOptionsImpl`
`HorzScaleItem`
Returns currently applied options

#### Returns​

Readonly <ChartOptionsImpl<HorzScaleItem>>

`Readonly`
`ChartOptionsImpl`
`HorzScaleItem`
Full set of currently applied options, including defaults

### takeScreenshot()​

takeScreenshot(addTopLayer?, includeCrosshair?): HTMLCanvasElement

`addTopLayer`
`includeCrosshair`
`HTMLCanvasElement`
Make a screenshot of the chart with all the elements excluding crosshair.

#### Parameters​

• addTopLayer?: boolean

`boolean`
if true, the top layer and primitives will be included in the screenshot (default: false)

• includeCrosshair?: boolean

`boolean`
works only if addTopLayer is enabled. If true, the crosshair will be included in the screenshot (default: false)

#### Returns​

HTMLCanvasElement

`HTMLCanvasElement`
A canvas with the chart drawn on. Any Canvas methods like toDataURL() or toBlob() can be used to serialize the result.

`Canvas`
`toDataURL()`
`toBlob()`
### addPane()​

addPane(preserveEmptyPane?): IPaneApi<HorzScaleItem>

`preserveEmptyPane`
`IPaneApi`
`HorzScaleItem`
Add a pane to the chart

#### Parameters​

• preserveEmptyPane?: boolean

`boolean`
Whether to preserve the empty pane

#### Returns​

IPaneApi<HorzScaleItem>

`IPaneApi`
`HorzScaleItem`
The pane API

### panes()​

panes(): IPaneApi<HorzScaleItem>[]

`IPaneApi`
`HorzScaleItem`
Returns array of panes' API

#### Returns​

IPaneApi<HorzScaleItem>[]

`IPaneApi`
`HorzScaleItem`
array of pane's Api

### removePane()​

removePane(index): void

`index`
`void`
Removes a pane with index

#### Parameters​

• index: number

`number`
the pane to be removed

#### Returns​

void

`void`
### swapPanes()​

swapPanes(first, second): void

`first`
`second`
`void`
swap the position of two panes.

#### Parameters​

• first: number

`number`
the first index

• second: number

`number`
the second index

#### Returns​

void

`void`
### autoSizeActive()​

autoSizeActive(): boolean

`boolean`
Returns the active state of the autoSize option. This can be used to check
whether the chart is handling resizing automatically with a ResizeObserver.

`autoSize`
`ResizeObserver`
#### Returns​

boolean

`boolean`
Whether the autoSize option is enabled and the active.

`autoSize`
### chartElement()​

chartElement(): HTMLDivElement

`HTMLDivElement`
Returns the generated div element containing the chart. This can be used for adding your own additional event listeners, or for measuring the
elements dimensions and position within the document.

#### Returns​

HTMLDivElement

`HTMLDivElement`
generated div element containing the chart.

### setCrosshairPosition()​

setCrosshairPosition(price, horizontalPosition, seriesApi): void

`price`
`horizontalPosition`
`seriesApi`
`void`
Set the crosshair position within the chart.

Usually the crosshair position is set automatically by the user's actions. However in some cases you may want to set it explicitly.

For example if you want to synchronise the crosshairs of two separate charts.

#### Parameters​

• price: number

`number`
The price (vertical coordinate) of the new crosshair position.

• horizontalPosition: HorzScaleItem

`HorzScaleItem`
The horizontal coordinate (time by default) of the new crosshair position.

• seriesApi: ISeriesApi<keyof SeriesOptionsMap, HorzScaleItem, CustomData<HorzScaleItem> | WhitespaceData<HorzScaleItem> | AreaData<HorzScaleItem> | BarData<HorzScaleItem> | CandlestickData<HorzScaleItem> | BaselineData<HorzScaleItem> | LineData<HorzScaleItem> | HistogramData<HorzScaleItem> | CustomSeriesWhitespaceData<HorzScaleItem>, CustomSeriesOptions | AreaSeriesOptions | BarSeriesOptions | CandlestickSeriesOptions | BaselineSeriesOptions | LineSeriesOptions | HistogramSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon> | DeepPartial <BarStyleOptions & SeriesOptionsCommon> | DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon> | DeepPartial <BaselineStyleOptions & SeriesOptionsCommon> | DeepPartial <LineStyleOptions & SeriesOptionsCommon> | DeepPartial <HistogramStyleOptions & SeriesOptionsCommon> | DeepPartial <CustomStyleOptions & SeriesOptionsCommon>>

`ISeriesApi`
`SeriesOptionsMap`
`HorzScaleItem`
`CustomData`
`HorzScaleItem`
`WhitespaceData`
`HorzScaleItem`
`AreaData`
`HorzScaleItem`
`BarData`
`HorzScaleItem`
`CandlestickData`
`HorzScaleItem`
`BaselineData`
`HorzScaleItem`
`LineData`
`HorzScaleItem`
`HistogramData`
`HorzScaleItem`
`CustomSeriesWhitespaceData`
`HorzScaleItem`
`CustomSeriesOptions`
`AreaSeriesOptions`
`BarSeriesOptions`
`CandlestickSeriesOptions`
`BaselineSeriesOptions`
`LineSeriesOptions`
`HistogramSeriesOptions`
`DeepPartial`
`AreaStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`BarStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`CandlestickStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`BaselineStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`LineStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`HistogramStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`CustomStyleOptions`
`SeriesOptionsCommon`
#### Returns​

void

`void`
### clearCrosshairPosition()​

clearCrosshairPosition(): void

`void`
Clear the crosshair position within the chart.

#### Returns​

void

`void`
### paneSize()​

paneSize(paneIndex?): PaneSize

`paneIndex`
`PaneSize`
Returns the dimensions of the chart pane (the plot surface which excludes time and price scales).
This would typically only be useful for plugin development.

#### Parameters​

• paneIndex?: number

`number`
The index of the pane

#### Returns​

PaneSize

`PaneSize`
Dimensions of the chart pane

#### Default Value​

0

`0`
### horzBehaviour()​

horzBehaviour(): IHorzScaleBehavior<HorzScaleItem>

`IHorzScaleBehavior`
`HorzScaleItem`
Returns the horizontal scale behaviour.

#### Returns​

IHorzScaleBehavior<HorzScaleItem>

`IHorzScaleBehavior`
`HorzScaleItem`
- Extended byType parametersMethodsremove()resize()addCustomSeries()addSeries()removeSeries()subscribeClick()unsubscribeClick()subscribeDblClick()unsubscribeDblClick()subscribeCrosshairMove()unsubscribeCrosshairMove()priceScale()timeScale()applyOptions()options()takeScreenshot()addPane()panes()removePane()swapPanes()autoSizeActive()chartElement()setCrosshairPosition()clearCrosshairPosition()paneSize()horzBehaviour()

- remove()resize()addCustomSeries()addSeries()removeSeries()subscribeClick()unsubscribeClick()subscribeDblClick()unsubscribeDblClick()subscribeCrosshairMove()unsubscribeCrosshairMove()priceScale()timeScale()applyOptions()options()takeScreenshot()addPane()panes()removePane()swapPanes()autoSizeActive()chartElement()setCrosshairPosition()clearCrosshairPosition()paneSize()horzBehaviour()

---

# lightweight-charts docs api interfaces CustomData

Base structure describing a single item of data for a custom series.

This type allows for any properties to be defined
within the interface. It is recommended that you extend this interface with
the required data structure.

## Extends​

- CustomSeriesWhitespaceData<HorzScaleItem>

`CustomSeriesWhitespaceData`
`HorzScaleItem`
## Type parameters​

• HorzScaleItem = Time

`Time`
## Properties​

### color?​

optional color: string

`optional`
`string`
If defined then this color will be used for the price line and price scale line
for this specific data item of the custom series.

### time​

time: HorzScaleItem

`HorzScaleItem`
The time of the data.

#### Inherited from​

CustomSeriesWhitespaceData . time

`CustomSeriesWhitespaceData`
`time`
### customValues?​

optional customValues: Record<string, unknown>

`optional`
`Record`
`string`
`unknown`
Additional custom values which will be ignored by the library, but
could be used by plugins.

#### Inherited from​

CustomSeriesWhitespaceData . customValues

`CustomSeriesWhitespaceData`
`customValues`
- ExtendsType parametersPropertiescolor?timecustomValues?

- color?timecustomValues?

---

# lightweight-charts docs api type-aliases MouseEventHandler

MouseEventHandler<HorzScaleItem>: (param) => void

`HorzScaleItem`
`param`
`void`
A custom function use to handle mouse events.

## Type parameters​

• HorzScaleItem

## Parameters​

• param: MouseEventParams<HorzScaleItem>

`MouseEventParams`
`HorzScaleItem`
## Returns​

void

`void`
- Type parametersParametersReturns

---

# lightweight-charts docs api interfaces CandlestickData

Structure describing a single item of data for candlestick series

## Extends​

- OhlcData<HorzScaleItem>

`OhlcData`
`HorzScaleItem`
## Type parameters​

• HorzScaleItem = Time

`Time`
## Properties​

### color?​

optional color: string

`optional`
`string`
Optional color value for certain data item. If missed, color from options is used

### borderColor?​

optional borderColor: string

`optional`
`string`
Optional border color value for certain data item. If missed, color from options is used

### wickColor?​

optional wickColor: string

`optional`
`string`
Optional wick color value for certain data item. If missed, color from options is used

### time​

time: HorzScaleItem

`HorzScaleItem`
The bar time.

#### Inherited from​

OhlcData . time

`OhlcData`
`time`
### open​

open: number

`number`
The open price.

#### Inherited from​

OhlcData . open

`OhlcData`
`open`
### high​

high: number

`number`
The high price.

#### Inherited from​

OhlcData . high

`OhlcData`
`high`
### low​

low: number

`number`
The low price.

#### Inherited from​

OhlcData . low

`OhlcData`
`low`
### close​

close: number

`number`
The close price.

#### Inherited from​

OhlcData . close

`OhlcData`
`close`
### customValues?​

optional customValues: Record<string, unknown>

`optional`
`Record`
`string`
`unknown`
Additional custom values which will be ignored by the library, but
could be used by plugins.

#### Inherited from​

OhlcData . customValues

`OhlcData`
`customValues`
- ExtendsType parametersPropertiescolor?borderColor?wickColor?timeopenhighlowclosecustomValues?

- color?borderColor?wickColor?timeopenhighlowclosecustomValues?

---

# lightweight-charts docs api interfaces IPaneApi

Represents the interface for interacting with a pane in a lightweight chart.

## Type parameters​

• HorzScaleItem

## Methods​

### getHeight()​

getHeight(): number

`number`
Retrieves the height of the pane in pixels.

#### Returns​

number

`number`
The height of the pane in pixels.

### setHeight()​

setHeight(height): void

`height`
`void`
Sets the height of the pane.

#### Parameters​

• height: number

`number`
The number of pixels to set as the height of the pane.

#### Returns​

void

`void`
### moveTo()​

moveTo(paneIndex): void

`paneIndex`
`void`
Moves the pane to a new position.

#### Parameters​

• paneIndex: number

`number`
The target index of the pane. Should be a number between 0 and the total number of panes - 1.

#### Returns​

void

`void`
### paneIndex()​

paneIndex(): number

`number`
Retrieves the index of the pane.

#### Returns​

number

`number`
The index of the pane. It is a number between 0 and the total number of panes - 1.

### getSeries()​

getSeries(): ISeriesApi<keyof SeriesOptionsMap, HorzScaleItem, AreaData<HorzScaleItem> | WhitespaceData<HorzScaleItem> | BarData<HorzScaleItem> | CandlestickData<HorzScaleItem> | BaselineData<HorzScaleItem> | LineData<HorzScaleItem> | HistogramData<HorzScaleItem> | CustomData<HorzScaleItem> | CustomSeriesWhitespaceData<HorzScaleItem>, CustomSeriesOptions | AreaSeriesOptions | BarSeriesOptions | CandlestickSeriesOptions | BaselineSeriesOptions | LineSeriesOptions | HistogramSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon> | DeepPartial <BarStyleOptions & SeriesOptionsCommon> | DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon> | DeepPartial <BaselineStyleOptions & SeriesOptionsCommon> | DeepPartial <LineStyleOptions & SeriesOptionsCommon> | DeepPartial <HistogramStyleOptions & SeriesOptionsCommon> | DeepPartial <CustomStyleOptions & SeriesOptionsCommon>>[]

`ISeriesApi`
`SeriesOptionsMap`
`HorzScaleItem`
`AreaData`
`HorzScaleItem`
`WhitespaceData`
`HorzScaleItem`
`BarData`
`HorzScaleItem`
`CandlestickData`
`HorzScaleItem`
`BaselineData`
`HorzScaleItem`
`LineData`
`HorzScaleItem`
`HistogramData`
`HorzScaleItem`
`CustomData`
`HorzScaleItem`
`CustomSeriesWhitespaceData`
`HorzScaleItem`
`CustomSeriesOptions`
`AreaSeriesOptions`
`BarSeriesOptions`
`CandlestickSeriesOptions`
`BaselineSeriesOptions`
`LineSeriesOptions`
`HistogramSeriesOptions`
`DeepPartial`
`AreaStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`BarStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`CandlestickStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`BaselineStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`LineStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`HistogramStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`CustomStyleOptions`
`SeriesOptionsCommon`
Retrieves the array of series for the current pane.

#### Returns​

ISeriesApi<keyof SeriesOptionsMap, HorzScaleItem, AreaData<HorzScaleItem> | WhitespaceData<HorzScaleItem> | BarData<HorzScaleItem> | CandlestickData<HorzScaleItem> | BaselineData<HorzScaleItem> | LineData<HorzScaleItem> | HistogramData<HorzScaleItem> | CustomData<HorzScaleItem> | CustomSeriesWhitespaceData<HorzScaleItem>, CustomSeriesOptions | AreaSeriesOptions | BarSeriesOptions | CandlestickSeriesOptions | BaselineSeriesOptions | LineSeriesOptions | HistogramSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon> | DeepPartial <BarStyleOptions & SeriesOptionsCommon> | DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon> | DeepPartial <BaselineStyleOptions & SeriesOptionsCommon> | DeepPartial <LineStyleOptions & SeriesOptionsCommon> | DeepPartial <HistogramStyleOptions & SeriesOptionsCommon> | DeepPartial <CustomStyleOptions & SeriesOptionsCommon>>[]

`ISeriesApi`
`SeriesOptionsMap`
`HorzScaleItem`
`AreaData`
`HorzScaleItem`
`WhitespaceData`
`HorzScaleItem`
`BarData`
`HorzScaleItem`
`CandlestickData`
`HorzScaleItem`
`BaselineData`
`HorzScaleItem`
`LineData`
`HorzScaleItem`
`HistogramData`
`HorzScaleItem`
`CustomData`
`HorzScaleItem`
`CustomSeriesWhitespaceData`
`HorzScaleItem`
`CustomSeriesOptions`
`AreaSeriesOptions`
`BarSeriesOptions`
`CandlestickSeriesOptions`
`BaselineSeriesOptions`
`LineSeriesOptions`
`HistogramSeriesOptions`
`DeepPartial`
`AreaStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`BarStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`CandlestickStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`BaselineStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`LineStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`HistogramStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`CustomStyleOptions`
`SeriesOptionsCommon`
An array of series.

### getHTMLElement()​

getHTMLElement(): HTMLElement

`HTMLElement`
Retrieves the HTML element of the pane.

#### Returns​

HTMLElement

`HTMLElement`
The HTML element of the pane or null if pane wasn't created yet.

### attachPrimitive()​

attachPrimitive(primitive): void

`primitive`
`void`
Attaches additional drawing primitive to the pane

#### Parameters​

• primitive: IPanePrimitive<HorzScaleItem>

`IPanePrimitive`
`HorzScaleItem`
any implementation of IPanePrimitive interface

#### Returns​

void

`void`
### detachPrimitive()​

detachPrimitive(primitive): void

`primitive`
`void`
Detaches additional drawing primitive from the pane

#### Parameters​

• primitive: IPanePrimitive<HorzScaleItem>

`IPanePrimitive`
`HorzScaleItem`
implementation of IPanePrimitive interface attached before
Does nothing if specified primitive was not attached

#### Returns​

void

`void`
### priceScale()​

priceScale(priceScaleId): IPriceScaleApi

`priceScaleId`
`IPriceScaleApi`
Returns the price scale with the given id.

#### Parameters​

• priceScaleId: string

`string`
ID of the price scale to find

#### Returns​

IPriceScaleApi

`IPriceScaleApi`
#### Throws​

If the price scale with the given id is not found in this pane

### setPreserveEmptyPane()​

setPreserveEmptyPane(preserve): void

`preserve`
`void`
Sets whether to preserve the empty pane

#### Parameters​

• preserve: boolean

`boolean`
Whether to preserve the empty pane

#### Returns​

void

`void`
### preserveEmptyPane()​

preserveEmptyPane(): boolean

`boolean`
Returns whether to preserve the empty pane

#### Returns​

boolean

`boolean`
Whether to preserve the empty pane

### getStretchFactor()​

getStretchFactor(): number

`number`
Returns the stretch factor of the pane.
Stretch factor determines the relative size of the pane compared to other panes.

#### Returns​

number

`number`
The stretch factor of the pane. Default is 1

### setStretchFactor()​

setStretchFactor(stretchFactor): void

`stretchFactor`
`void`
Sets the stretch factor of the pane.
When you creating a pane, the stretch factor is 1 by default.
So if you have three panes, and you want to make the first pane twice as big as the second and third panes, you can set the stretch factor of the first pane to 2000.
Example:

```text
const pane1 = chart.addPane();const pane2 = chart.addPane();const pane3 = chart.addPane();pane1.setStretchFactor(0.2);pane2.setStretchFactor(0.3);pane3.setStretchFactor(0.5);// Now the first pane will be 20% of the total height, the second pane will be 30% of the total height, and the third pane will be 50% of the total height.// Note: if you have one pane with default stretch factor of 1 and set other pane's stretch factor to 50,// library will try to make second pane 50 times smaller than the first pane
```

#### Parameters​

• stretchFactor: number

`number`
The stretch factor of the pane.

#### Returns​

void

`void`
### addCustomSeries()​

addCustomSeries<TData, TOptions, TPartialOptions>(customPaneView, customOptions?): ISeriesApi<"Custom", HorzScaleItem, WhitespaceData<HorzScaleItem> | TData, TOptions, TPartialOptions>

`TData`
`TOptions`
`TPartialOptions`
`customPaneView`
`customOptions`
`ISeriesApi`
`"Custom"`
`HorzScaleItem`
`WhitespaceData`
`HorzScaleItem`
`TData`
`TOptions`
`TPartialOptions`
Creates a custom series with specified parameters.

A custom series is a generic series which can be extended with a custom renderer to
implement chart types which the library doesn't support by default.

#### Type parameters​

• TData extends CustomData<HorzScaleItem>

`CustomData`
`HorzScaleItem`
• TOptions extends CustomSeriesOptions

`CustomSeriesOptions`
• TPartialOptions extends DeepPartial<TOptions & SeriesOptionsCommon> = DeepPartial<TOptions & SeriesOptionsCommon>

`DeepPartial`
`TOptions`
`SeriesOptionsCommon`
`DeepPartial`
`TOptions`
`SeriesOptionsCommon`
#### Parameters​

• customPaneView: ICustomSeriesPaneView<HorzScaleItem, TData, TOptions>

`ICustomSeriesPaneView`
`HorzScaleItem`
`TData`
`TOptions`
A custom series pane view which implements the custom renderer.

• customOptions?: DeepPartial<TOptions & SeriesOptionsCommon>

`DeepPartial`
`TOptions`
`SeriesOptionsCommon`
Customization parameters of the series being created.

```text
const series = pane.addCustomSeries(myCustomPaneView);
```

#### Returns​

ISeriesApi<"Custom", HorzScaleItem, WhitespaceData<HorzScaleItem> | TData, TOptions, TPartialOptions>

`ISeriesApi`
`"Custom"`
`HorzScaleItem`
`WhitespaceData`
`HorzScaleItem`
`TData`
`TOptions`
`TPartialOptions`
### addSeries()​

addSeries<T>(definition, options?): ISeriesApi<T, HorzScaleItem, SeriesDataItemTypeMap<HorzScaleItem>[T], SeriesOptionsMap[T], SeriesPartialOptionsMap[T]>

`T`
`definition`
`options`
`ISeriesApi`
`T`
`HorzScaleItem`
`SeriesDataItemTypeMap`
`HorzScaleItem`
`T`
`SeriesOptionsMap`
`T`
`SeriesPartialOptionsMap`
`T`
Creates a series with specified parameters.

#### Type parameters​

• T extends keyof SeriesOptionsMap

`SeriesOptionsMap`
#### Parameters​

• definition: SeriesDefinition<T>

`SeriesDefinition`
`T`
A series definition.

• options?: SeriesPartialOptionsMap[T]

`SeriesPartialOptionsMap`
`T`
Customization parameters of the series being created.

```text
const series = pane.addSeries(LineSeries, { lineWidth: 2 });
```

#### Returns​

ISeriesApi<T, HorzScaleItem, SeriesDataItemTypeMap<HorzScaleItem>[T], SeriesOptionsMap[T], SeriesPartialOptionsMap[T]>

`ISeriesApi`
`T`
`HorzScaleItem`
`SeriesDataItemTypeMap`
`HorzScaleItem`
`T`
`SeriesOptionsMap`
`T`
`SeriesPartialOptionsMap`
`T`
- Type parametersMethodsgetHeight()setHeight()moveTo()paneIndex()getSeries()getHTMLElement()attachPrimitive()detachPrimitive()priceScale()setPreserveEmptyPane()preserveEmptyPane()getStretchFactor()setStretchFactor()addCustomSeries()addSeries()

- getHeight()setHeight()moveTo()paneIndex()getSeries()getHTMLElement()attachPrimitive()detachPrimitive()priceScale()setPreserveEmptyPane()preserveEmptyPane()getStretchFactor()setStretchFactor()addCustomSeries()addSeries()

---

# lightweight-charts docs api interfaces SeriesPartialOptionsMap

Represents the type of partial options for each series type.

For example a bar series has options represented by BarSeriesPartialOptions.

## Properties​

### Bar​

Bar: DeepPartial <BarStyleOptions & SeriesOptionsCommon>

`DeepPartial`
`BarStyleOptions`
`SeriesOptionsCommon`
The type of bar series partial options.

### Candlestick​

Candlestick: DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon>

`DeepPartial`
`CandlestickStyleOptions`
`SeriesOptionsCommon`
The type of candlestick series partial options.

### Area​

Area: DeepPartial <AreaStyleOptions & SeriesOptionsCommon>

`DeepPartial`
`AreaStyleOptions`
`SeriesOptionsCommon`
The type of area series partial options.

### Baseline​

Baseline: DeepPartial <BaselineStyleOptions & SeriesOptionsCommon>

`DeepPartial`
`BaselineStyleOptions`
`SeriesOptionsCommon`
The type of baseline series partial options.

### Line​

Line: DeepPartial <LineStyleOptions & SeriesOptionsCommon>

`DeepPartial`
`LineStyleOptions`
`SeriesOptionsCommon`
The type of line series partial options.

### Histogram​

Histogram: DeepPartial <HistogramStyleOptions & SeriesOptionsCommon>

`DeepPartial`
`HistogramStyleOptions`
`SeriesOptionsCommon`
The type of histogram series partial options.

### Custom​

Custom: DeepPartial <CustomStyleOptions & SeriesOptionsCommon>

`DeepPartial`
`CustomStyleOptions`
`SeriesOptionsCommon`
The type of a custom series partial options.

- PropertiesBarCandlestickAreaBaselineLineHistogramCustom

- BarCandlestickAreaBaselineLineHistogramCustom

---

# lightweight-charts docs api type-aliases AreaSeriesOptions

AreaSeriesOptions: SeriesOptions <AreaStyleOptions>

`SeriesOptions`
`AreaStyleOptions`
Represents area series options.

---

# lightweight-charts docs api interfaces BaselineData

Structure describing a single item of data for baseline series

## Extends​

- SingleValueData<HorzScaleItem>

`SingleValueData`
`HorzScaleItem`
## Type parameters​

• HorzScaleItem = Time

`Time`
## Properties​

### topFillColor1?​

optional topFillColor1: string

`optional`
`string`
Optional top area top fill color value for certain data item. If missed, color from options is used

### topFillColor2?​

optional topFillColor2: string

`optional`
`string`
Optional top area bottom fill color value for certain data item. If missed, color from options is used

### topLineColor?​

optional topLineColor: string

`optional`
`string`
Optional top area line color value for certain data item. If missed, color from options is used

### bottomFillColor1?​

optional bottomFillColor1: string

`optional`
`string`
Optional bottom area top fill color value for certain data item. If missed, color from options is used

### bottomFillColor2?​

optional bottomFillColor2: string

`optional`
`string`
Optional bottom area bottom fill color value for certain data item. If missed, color from options is used

### bottomLineColor?​

optional bottomLineColor: string

`optional`
`string`
Optional bottom area line color value for certain data item. If missed, color from options is used

### time​

time: HorzScaleItem

`HorzScaleItem`
The time of the data.

#### Inherited from​

SingleValueData . time

`SingleValueData`
`time`
### value​

value: number

`number`
Price value of the data.

#### Inherited from​

SingleValueData . value

`SingleValueData`
`value`
### customValues?​

optional customValues: Record<string, unknown>

`optional`
`Record`
`string`
`unknown`
Additional custom values which will be ignored by the library, but
could be used by plugins.

#### Inherited from​

SingleValueData . customValues

`SingleValueData`
`customValues`
- ExtendsType parametersPropertiestopFillColor1?topFillColor2?topLineColor?bottomFillColor1?bottomFillColor2?bottomLineColor?timevaluecustomValues?

- topFillColor1?topFillColor2?topLineColor?bottomFillColor1?bottomFillColor2?bottomLineColor?timevaluecustomValues?

---

# lightweight-charts docs api interfaces CustomSeriesWhitespaceData

Represents a whitespace data item, which is a data point without a value.

## Extended by​

- CustomData

`CustomData`
## Type parameters​

• HorzScaleItem

## Properties​

### time​

time: HorzScaleItem

`HorzScaleItem`
The time of the data.

### customValues?​

optional customValues: Record<string, unknown>

`optional`
`Record`
`string`
`unknown`
Additional custom values which will be ignored by the library, but
could be used by plugins.

- Extended byType parametersPropertiestimecustomValues?

- timecustomValues?

---

# lightweight-charts docs api interfaces BaselineStyleOptions

Represents style options for a baseline series.

## Properties​

### baseValue​

baseValue: BaseValuePrice

`BaseValuePrice`
Base value of the series.

#### Default Value​

{ type: 'price', price: 0 }

`{ type: 'price', price: 0 }`
### relativeGradient​

relativeGradient: boolean

`boolean`
Gradient is relative to the base value and the currently visible range.
If it is false, the gradient is relative to the top and bottom of the chart.

#### Default Value​

false

`false`
### topFillColor1​

topFillColor1: string

`string`
The first color of the top area.

#### Default Value​

'rgba(38, 166, 154, 0.28)'

`'rgba(38, 166, 154, 0.28)'`
### topFillColor2​

topFillColor2: string

`string`
The second color of the top area.

#### Default Value​

'rgba(38, 166, 154, 0.05)'

`'rgba(38, 166, 154, 0.05)'`
### topLineColor​

topLineColor: string

`string`
The line color of the top area.

#### Default Value​

'rgba(38, 166, 154, 1)'

`'rgba(38, 166, 154, 1)'`
### bottomFillColor1​

bottomFillColor1: string

`string`
The first color of the bottom area.

#### Default Value​

'rgba(239, 83, 80, 0.05)'

`'rgba(239, 83, 80, 0.05)'`
### bottomFillColor2​

bottomFillColor2: string

`string`
The second color of the bottom area.

#### Default Value​

'rgba(239, 83, 80, 0.28)'

`'rgba(239, 83, 80, 0.28)'`
### bottomLineColor​

bottomLineColor: string

`string`
The line color of the bottom area.

#### Default Value​

'rgba(239, 83, 80, 1)'

`'rgba(239, 83, 80, 1)'`
### lineWidth​

lineWidth: LineWidth

`LineWidth`
Line width.

#### Default Value​

3

`3`
### lineStyle​

lineStyle: LineStyle

`LineStyle`
Line style.

#### Default Value​

```text
{@link LineStyle.Solid}
```

### lineType​

lineType: LineType

`LineType`
Line type.

#### Default Value​

```text
{@link LineType.Simple}
```

### lineVisible​

lineVisible: boolean

`boolean`
Show series line.

#### Default Value​

true

`true`
### pointMarkersVisible​

pointMarkersVisible: boolean

`boolean`
Show circle markers on each point.

#### Default Value​

false

`false`
### pointMarkersRadius?​

optional pointMarkersRadius: number

`optional`
`number`
Circle markers radius in pixels.

#### Default Value​

undefined

`undefined`
### crosshairMarkerVisible​

crosshairMarkerVisible: boolean

`boolean`
Show the crosshair marker.

#### Default Value​

true

`true`
### crosshairMarkerRadius​

crosshairMarkerRadius: number

`number`
Crosshair marker radius in pixels.

#### Default Value​

4

`4`
### crosshairMarkerBorderColor​

crosshairMarkerBorderColor: string

`string`
Crosshair marker border color. An empty string falls back to the color of the series under the crosshair.

#### Default Value​

''

`''`
### crosshairMarkerBackgroundColor​

crosshairMarkerBackgroundColor: string

`string`
The crosshair marker background color. An empty string falls back to the color of the series under the crosshair.

#### Default Value​

''

`''`
### crosshairMarkerBorderWidth​

crosshairMarkerBorderWidth: number

`number`
Crosshair marker border width in pixels.

#### Default Value​

2

`2`
### lastPriceAnimation​

lastPriceAnimation: LastPriceAnimationMode

`LastPriceAnimationMode`
Last price animation mode.

#### Default Value​

```text
{@link LastPriceAnimationMode.Disabled}
```

- PropertiesbaseValuerelativeGradienttopFillColor1topFillColor2topLineColorbottomFillColor1bottomFillColor2bottomLineColorlineWidthlineStylelineTypelineVisiblepointMarkersVisiblepointMarkersRadius?crosshairMarkerVisiblecrosshairMarkerRadiuscrosshairMarkerBorderColorcrosshairMarkerBackgroundColorcrosshairMarkerBorderWidthlastPriceAnimation

- baseValuerelativeGradienttopFillColor1topFillColor2topLineColorbottomFillColor1bottomFillColor2bottomLineColorlineWidthlineStylelineTypelineVisiblepointMarkersVisiblepointMarkersRadius?crosshairMarkerVisiblecrosshairMarkerRadiuscrosshairMarkerBorderColorcrosshairMarkerBackgroundColorcrosshairMarkerBorderWidthlastPriceAnimation

---

# lightweight-charts docs api type-aliases BarSeriesOptions

BarSeriesOptions: SeriesOptions <BarStyleOptions>

`SeriesOptions`
`BarStyleOptions`
Represents bar series options.

---

# lightweight-charts docs api interfaces SeriesDefinition

Series definition interface.

## Type parameters​

• T extends SeriesType

`SeriesType`
## Properties​

### type​

readonly type: T

`readonly`
`T`
Series type.

### isBuiltIn​

readonly isBuiltIn: boolean

`readonly`
`boolean`
Indicates if the series is built-in.

### defaultOptions​

readonly defaultOptions: SeriesStyleOptionsMap[T]

`readonly`
`SeriesStyleOptionsMap`
`T`
Default series options.

- Type parametersPropertiestypeisBuiltIndefaultOptions

- typeisBuiltIndefaultOptions

---

# lightweight-charts docs api interfaces HistogramData

Structure describing a single item of data for histogram series

## Extends​

- SingleValueData<HorzScaleItem>

`SingleValueData`
`HorzScaleItem`
## Type parameters​

• HorzScaleItem = Time

`Time`
## Properties​

### color?​

optional color: string

`optional`
`string`
Optional color value for certain data item. If missed, color from options is used

### time​

time: HorzScaleItem

`HorzScaleItem`
The time of the data.

#### Inherited from​

SingleValueData . time

`SingleValueData`
`time`
### value​

value: number

`number`
Price value of the data.

#### Inherited from​

SingleValueData . value

`SingleValueData`
`value`
### customValues?​

optional customValues: Record<string, unknown>

`optional`
`Record`
`string`
`unknown`
Additional custom values which will be ignored by the library, but
could be used by plugins.

#### Inherited from​

SingleValueData . customValues

`SingleValueData`
`customValues`
- ExtendsType parametersPropertiescolor?timevaluecustomValues?

- color?timevaluecustomValues?

---

# lightweight-charts docs api type-aliases BaselineSeriesOptions

BaselineSeriesOptions: SeriesOptions <BaselineStyleOptions>

`SeriesOptions`
`BaselineStyleOptions`
Structure describing baseline series options.

---

# lightweight-charts docs api interfaces LineData

Structure describing a single item of data for line series

## Extends​

- SingleValueData<HorzScaleItem>

`SingleValueData`
`HorzScaleItem`
## Type parameters​

• HorzScaleItem = Time

`Time`
## Properties​

### color?​

optional color: string

`optional`
`string`
Optional color value for certain data item. If missed, color from options is used

### time​

time: HorzScaleItem

`HorzScaleItem`
The time of the data.

#### Inherited from​

SingleValueData . time

`SingleValueData`
`time`
### value​

value: number

`number`
Price value of the data.

#### Inherited from​

SingleValueData . value

`SingleValueData`
`value`
### customValues?​

optional customValues: Record<string, unknown>

`optional`
`Record`
`string`
`unknown`
Additional custom values which will be ignored by the library, but
could be used by plugins.

#### Inherited from​

SingleValueData . customValues

`SingleValueData`
`customValues`
- ExtendsType parametersPropertiescolor?timevaluecustomValues?

- color?timevaluecustomValues?

---

# lightweight-charts docs api type-aliases Time

Time: UTCTimestamp | BusinessDay | string

`UTCTimestamp`
`BusinessDay`
`string`
The Time type is used to represent the time of data items.

Values can be a UTCTimestamp, a BusinessDay, or a business day string in ISO format.

## Example​

```text
const timestamp = 1529899200; // Literal timestamp representing 2018-06-25T04:00:00.000Zconst businessDay = { year: 2019, month: 6, day: 1 }; // June 1, 2019const businessDayString = '2021-02-03'; // Business day string literal
```

- Example

---

# lightweight-charts docs api interfaces ICustomSeriesPaneView

This interface represents the view for the custom series

## Type parameters​

• HorzScaleItem = Time

`Time`
• TData extends CustomData<HorzScaleItem> = CustomData<HorzScaleItem>

`CustomData`
`HorzScaleItem`
`CustomData`
`HorzScaleItem`
• TSeriesOptions extends CustomSeriesOptions = CustomSeriesOptions

`CustomSeriesOptions`
`CustomSeriesOptions`
## Methods​

### renderer()​

renderer(): ICustomSeriesPaneRenderer

`ICustomSeriesPaneRenderer`
This method returns a renderer - special object to draw data for the series
on the main chart pane.

#### Returns​

ICustomSeriesPaneRenderer

`ICustomSeriesPaneRenderer`
an renderer object to be used for drawing.

### update()​

update(data, seriesOptions): void

`data`
`seriesOptions`
`void`
This method will be called with the latest data for the renderer to use
during the next paint.

#### Parameters​

• data: PaneRendererCustomData<HorzScaleItem, TData>

`PaneRendererCustomData`
`HorzScaleItem`
`TData`
• seriesOptions: TSeriesOptions

`TSeriesOptions`
#### Returns​

void

`void`
### priceValueBuilder()​

priceValueBuilder(plotRow): CustomSeriesPricePlotValues

`plotRow`
`CustomSeriesPricePlotValues`
A function for interpreting the custom series data and returning an array of numbers
representing the price values for the item. These price values are used
by the chart to determine the auto-scaling (to ensure the items are in view) and the crosshair
and price line positions. The last value in the array will be used as the current value. You shouldn't need to
have more than 3 values in this array since the library only needs a largest, smallest, and current value.

#### Parameters​

• plotRow: TData

`TData`
#### Returns​

CustomSeriesPricePlotValues

`CustomSeriesPricePlotValues`
### isWhitespace()​

isWhitespace(data): data is CustomSeriesWhitespaceData<HorzScaleItem>

`data`
`data is CustomSeriesWhitespaceData<HorzScaleItem>`
A function for testing whether a data point should be considered fully specified, or if it should
be considered as whitespace. Should return true if is whitespace.

`true`
#### Parameters​

• data: TData | CustomSeriesWhitespaceData<HorzScaleItem>

`TData`
`CustomSeriesWhitespaceData`
`HorzScaleItem`
data point to be tested

#### Returns​

data is CustomSeriesWhitespaceData<HorzScaleItem>

`data is CustomSeriesWhitespaceData<HorzScaleItem>`
### defaultOptions()​

defaultOptions(): TSeriesOptions

`TSeriesOptions`
Default options

#### Returns​

TSeriesOptions

`TSeriesOptions`
### destroy()?​

optional destroy(): void

`optional`
`void`
This method will be evoked when the series has been removed from the chart. This method should be used to
clean up any objects, references, and other items that could potentially cause memory leaks.

This method should contain all the necessary code to clean up the object before it is removed from memory.
This includes removing any event listeners or timers that are attached to the object, removing any references
to other objects, and resetting any values or properties that were modified during the lifetime of the object.

#### Returns​

void

`void`
- Type parametersMethodsrenderer()update()priceValueBuilder()isWhitespace()defaultOptions()destroy()?

- renderer()update()priceValueBuilder()isWhitespace()defaultOptions()destroy()?

---

# lightweight-charts docs api interfaces AreaData

Structure describing a single item of data for area series

## Extends​

- SingleValueData<HorzScaleItem>

`SingleValueData`
`HorzScaleItem`
## Type parameters​

• HorzScaleItem = Time

`Time`
## Properties​

### lineColor?​

optional lineColor: string

`optional`
`string`
Optional line color value for certain data item. If missed, color from options is used

### topColor?​

optional topColor: string

`optional`
`string`
Optional top color value for certain data item. If missed, color from options is used

### bottomColor?​

optional bottomColor: string

`optional`
`string`
Optional bottom color value for certain data item. If missed, color from options is used

### time​

time: HorzScaleItem

`HorzScaleItem`
The time of the data.

#### Inherited from​

SingleValueData . time

`SingleValueData`
`time`
### value​

value: number

`number`
Price value of the data.

#### Inherited from​

SingleValueData . value

`SingleValueData`
`value`
### customValues?​

optional customValues: Record<string, unknown>

`optional`
`Record`
`string`
`unknown`
Additional custom values which will be ignored by the library, but
could be used by plugins.

#### Inherited from​

SingleValueData . customValues

`SingleValueData`
`customValues`
- ExtendsType parametersPropertieslineColor?topColor?bottomColor?timevaluecustomValues?

- lineColor?topColor?bottomColor?timevaluecustomValues?

---

# lightweight-charts docs api interfaces PaneSize

Dimensions of the Chart Pane
(the main chart area which excludes the time and price scales).

## Properties​

### height​

height: number

`number`
Height of the Chart Pane (pixels)

### width​

width: number

`number`
Width of the Chart Pane (pixels)

- Propertiesheightwidth

- heightwidth

---

# lightweight-charts docs api interfaces HistogramStyleOptions

Represents style options for a histogram series.

## Properties​

### color​

color: string

`string`
Column color.

#### Default Value​

'#26a69a'

`'#26a69a'`
### base​

base: number

`number`
Initial level of histogram columns.

#### Default Value​

0

`0`
- Propertiescolorbase

- colorbase

---

# lightweight-charts docs api interfaces BarData

Structure describing a single item of data for bar series

## Extends​

- OhlcData<HorzScaleItem>

`OhlcData`
`HorzScaleItem`
## Type parameters​

• HorzScaleItem = Time

`Time`
## Properties​

### color?​

optional color: string

`optional`
`string`
Optional color value for certain data item. If missed, color from options is used

### time​

time: HorzScaleItem

`HorzScaleItem`
The bar time.

#### Inherited from​

OhlcData . time

`OhlcData`
`time`
### open​

open: number

`number`
The open price.

#### Inherited from​

OhlcData . open

`OhlcData`
`open`
### high​

high: number

`number`
The high price.

#### Inherited from​

OhlcData . high

`OhlcData`
`high`
### low​

low: number

`number`
The low price.

#### Inherited from​

OhlcData . low

`OhlcData`
`low`
### close​

close: number

`number`
The close price.

#### Inherited from​

OhlcData . close

`OhlcData`
`close`
### customValues?​

optional customValues: Record<string, unknown>

`optional`
`Record`
`string`
`unknown`
Additional custom values which will be ignored by the library, but
could be used by plugins.

#### Inherited from​

OhlcData . customValues

`OhlcData`
`customValues`
- ExtendsType parametersPropertiescolor?timeopenhighlowclosecustomValues?

- color?timeopenhighlowclosecustomValues?

---

# lightweight-charts docs api interfaces ChartOptionsImpl

Structure describing options of the chart. Series options are to be set separately

## Extends​

- ChartOptionsBase

`ChartOptionsBase`
## Extended by​

- PriceChartOptions

- TimeChartOptions

- YieldCurveChartOptions

`PriceChartOptions`
`TimeChartOptions`
`YieldCurveChartOptions`
## Type parameters​

• HorzScaleItem

## Properties​

### width​

width: number

`number`
Width of the chart in pixels

#### Default Value​

If 0 (default) or none value provided, then a size of the widget will be calculated based its container's size.

`0`
#### Inherited from​

ChartOptionsBase . width

`ChartOptionsBase`
`width`
### height​

height: number

`number`
Height of the chart in pixels

#### Default Value​

If 0 (default) or none value provided, then a size of the widget will be calculated based its container's size.

`0`
#### Inherited from​

ChartOptionsBase . height

`ChartOptionsBase`
`height`
### autoSize​

autoSize: boolean

`boolean`
Setting this flag to true will make the chart watch the chart container's size and automatically resize the chart to fit its container whenever the size changes.

`true`
This feature requires ResizeObserver class to be available in the global scope.
Note that calling code is responsible for providing a polyfill if required. If the global scope does not have ResizeObserver, a warning will appear and the flag will be ignored.

`ResizeObserver`
`ResizeObserver`
Please pay attention that autoSize option and explicit sizes options width and height don't conflict with one another.
If you specify autoSize flag, then width and height options will be ignored unless ResizeObserver has failed. If it fails then the values will be used as fallback.

`autoSize`
`width`
`height`
`autoSize`
`width`
`height`
`ResizeObserver`
The flag autoSize could also be set with and unset with applyOptions function.

`autoSize`
`applyOptions`
```text
const chart = LightweightCharts.createChart(document.body, {    autoSize: true,});
```

#### Inherited from​

ChartOptionsBase . autoSize

`ChartOptionsBase`
`autoSize`
### layout​

layout: LayoutOptions

`LayoutOptions`
Layout options

#### Inherited from​

ChartOptionsBase . layout

`ChartOptionsBase`
`layout`
### leftPriceScale​

leftPriceScale: PriceScaleOptions

`PriceScaleOptions`
Left price scale options

#### Inherited from​

ChartOptionsBase . leftPriceScale

`ChartOptionsBase`
`leftPriceScale`
### rightPriceScale​

rightPriceScale: PriceScaleOptions

`PriceScaleOptions`
Right price scale options

#### Inherited from​

ChartOptionsBase . rightPriceScale

`ChartOptionsBase`
`rightPriceScale`
### overlayPriceScales​

overlayPriceScales: OverlayPriceScaleOptions

`OverlayPriceScaleOptions`
Overlay price scale options

#### Inherited from​

ChartOptionsBase . overlayPriceScales

`ChartOptionsBase`
`overlayPriceScales`
### timeScale​

timeScale: HorzScaleOptions

`HorzScaleOptions`
Time scale options

#### Inherited from​

ChartOptionsBase . timeScale

`ChartOptionsBase`
`timeScale`
### crosshair​

crosshair: CrosshairOptions

`CrosshairOptions`
The crosshair shows the intersection of the price and time scale values at any point on the chart.

#### Inherited from​

ChartOptionsBase . crosshair

`ChartOptionsBase`
`crosshair`
### grid​

grid: GridOptions

`GridOptions`
A grid is represented in the chart background as a vertical and horizontal lines drawn at the levels of visible marks of price and the time scales.

#### Inherited from​

ChartOptionsBase . grid

`ChartOptionsBase`
`grid`
### handleScroll​

handleScroll: boolean | HandleScrollOptions

`boolean`
`HandleScrollOptions`
Scroll options, or a boolean flag that enables/disables scrolling

#### Inherited from​

ChartOptionsBase . handleScroll

`ChartOptionsBase`
`handleScroll`
### handleScale​

handleScale: boolean | HandleScaleOptions

`boolean`
`HandleScaleOptions`
Scale options, or a boolean flag that enables/disables scaling

#### Inherited from​

ChartOptionsBase . handleScale

`ChartOptionsBase`
`handleScale`
### kineticScroll​

kineticScroll: KineticScrollOptions

`KineticScrollOptions`
Kinetic scroll options

#### Inherited from​

ChartOptionsBase . kineticScroll

`ChartOptionsBase`
`kineticScroll`
### trackingMode​

trackingMode: TrackingModeOptions

`TrackingModeOptions`
Represent options for the tracking mode's behavior.

Mobile users will not have the ability to see the values/dates like they do on desktop.
To see it, they should enter the tracking mode. The tracking mode will deactivate the scrolling
and make it possible to check values and dates.

#### Inherited from​

ChartOptionsBase . trackingMode

`ChartOptionsBase`
`trackingMode`
### addDefaultPane​

addDefaultPane: boolean

`boolean`
Whether to add a default pane to the chart
Disable this option when you want to create a chart with no panes and add them manually

#### Default Value​

true

`true`
#### Inherited from​

ChartOptionsBase . addDefaultPane

`ChartOptionsBase`
`addDefaultPane`
### localization​

localization: LocalizationOptions<HorzScaleItem>

`LocalizationOptions`
`HorzScaleItem`
Localization options.

#### Overrides​

ChartOptionsBase . localization

`ChartOptionsBase`
`localization`
- ExtendsExtended byType parametersPropertieswidthheightautoSizelayoutleftPriceScalerightPriceScaleoverlayPriceScalestimeScalecrosshairgridhandleScrollhandleScalekineticScrolltrackingModeaddDefaultPanelocalization

- widthheightautoSizelayoutleftPriceScalerightPriceScaleoverlayPriceScalestimeScalecrosshairgridhandleScrollhandleScalekineticScrolltrackingModeaddDefaultPanelocalization

---

# lightweight-charts docs api interfaces IHorzScaleBehavior

Class interface for Horizontal scale behavior

## Type parameters​

• HorzScaleItem

## Methods​

### options()​

options(): ChartOptionsImpl<HorzScaleItem>

`ChartOptionsImpl`
`HorzScaleItem`
Structure describing options of the chart.

#### Returns​

ChartOptionsImpl<HorzScaleItem>

`ChartOptionsImpl`
`HorzScaleItem`
ChartOptionsBase

### setOptions()​

setOptions(options): void

`options`
`void`
Set the chart options. Note that this is different to applyOptions since the provided options will overwrite the current options
instead of merging with the current options.

`applyOptions`
#### Parameters​

• options: ChartOptionsImpl<HorzScaleItem>

`ChartOptionsImpl`
`HorzScaleItem`
Chart options to be set

#### Returns​

void

`void`
void

### preprocessData()​

preprocessData(data): void

`data`
`void`
Method to preprocess the data.

#### Parameters​

• data: DataItem<HorzScaleItem> | DataItem<HorzScaleItem>[]

`DataItem`
`HorzScaleItem`
`DataItem`
`HorzScaleItem`
Data items for the series

#### Returns​

void

`void`
void

### convertHorzItemToInternal()​

convertHorzItemToInternal(item): object

`item`
`object`
Convert horizontal scale item into an internal horizontal scale item.

#### Parameters​

• item: HorzScaleItem

`HorzScaleItem`
item to be converted

#### Returns​

object

`object`
InternalHorzScaleItem

##### [species]​

[species]: "InternalHorzScaleItem"

`"InternalHorzScaleItem"`
The 'name' or species of the nominal.

### createConverterToInternalObj()​

createConverterToInternalObj(data): HorzScaleItemConverterToInternalObj<HorzScaleItem>

`data`
`HorzScaleItemConverterToInternalObj`
`HorzScaleItem`
Creates and returns a converter for changing series data into internal horizontal scale items.

#### Parameters​

• data: (AreaData<HorzScaleItem> | WhitespaceData<HorzScaleItem> | BarData<HorzScaleItem> | CandlestickData<HorzScaleItem> | BaselineData<HorzScaleItem> | LineData<HorzScaleItem> | HistogramData<HorzScaleItem> | CustomData<HorzScaleItem> | CustomSeriesWhitespaceData<HorzScaleItem>)[]

`AreaData`
`HorzScaleItem`
`WhitespaceData`
`HorzScaleItem`
`BarData`
`HorzScaleItem`
`CandlestickData`
`HorzScaleItem`
`BaselineData`
`HorzScaleItem`
`LineData`
`HorzScaleItem`
`HistogramData`
`HorzScaleItem`
`CustomData`
`HorzScaleItem`
`CustomSeriesWhitespaceData`
`HorzScaleItem`
series data

#### Returns​

HorzScaleItemConverterToInternalObj<HorzScaleItem>

`HorzScaleItemConverterToInternalObj`
`HorzScaleItem`
HorzScaleItemConverterToInternalObj

### key()​

key(internalItem): InternalHorzScaleItemKey

`internalItem`
`InternalHorzScaleItemKey`
Returns the key for the specified horizontal scale item.

#### Parameters​

• internalItem: HorzScaleItem | object

`HorzScaleItem`
`object`
horizontal scale item for which the key should be returned

#### Returns​

InternalHorzScaleItemKey

`InternalHorzScaleItemKey`
InternalHorzScaleItemKey

### cacheKey()​

cacheKey(internalItem): number

`internalItem`
`number`
Returns the cache key for the specified horizontal scale item.

#### Parameters​

• internalItem

horizontal scale item for which the cache key should be returned

• internalItem.[species]: "InternalHorzScaleItem"

`"InternalHorzScaleItem"`
The 'name' or species of the nominal.

#### Returns​

number

`number`
number

### updateFormatter()​

updateFormatter(options): void

`options`
`void`
Update the formatter with the localization options.

#### Parameters​

• options: LocalizationOptions<HorzScaleItem>

`LocalizationOptions`
`HorzScaleItem`
Localization options

#### Returns​

void

`void`
void

### formatHorzItem()​

formatHorzItem(item): string

`item`
`string`
Format the horizontal scale item into a display string.

#### Parameters​

• item

horizontal scale item to be formatted as a string

• item.[species]: "InternalHorzScaleItem"

`"InternalHorzScaleItem"`
The 'name' or species of the nominal.

#### Returns​

string

`string`
string

### formatTickmark()​

formatTickmark(item, localizationOptions): string

`item`
`localizationOptions`
`string`
Format the horizontal scale tickmark into a display string.

#### Parameters​

• item: TickMark

`TickMark`
tickmark item

• localizationOptions: LocalizationOptions<HorzScaleItem>

`LocalizationOptions`
`HorzScaleItem`
Localization options

#### Returns​

string

`string`
string

### maxTickMarkWeight()​

maxTickMarkWeight(marks): TickMarkWeightValue

`marks`
`TickMarkWeightValue`
Returns the maximum tickmark weight value for the specified tickmarks on the time scale.

#### Parameters​

• marks: TimeMark[]

`TimeMark`
Timescale tick marks

#### Returns​

TickMarkWeightValue

`TickMarkWeightValue`
TickMarkWeightValue

### fillWeightsForPoints()​

fillWeightsForPoints(sortedTimePoints, startIndex): void

`sortedTimePoints`
`startIndex`
`void`
Fill the weights for the sorted time scale points.

#### Parameters​

• sortedTimePoints: readonly Mutable <TimeScalePoint>[]

`Mutable`
`TimeScalePoint`
sorted time scale points

• startIndex: number

`number`
starting index

#### Returns​

void

`void`
void

### shouldResetTickmarkLabels()?​

optional shouldResetTickmarkLabels(tickMarks): boolean

`optional`
`tickMarks`
`boolean`
If returns true, then the tick mark formatter will be called for all the visible
tick marks even if the formatter has previously been called for a specific tick mark.
This allows you to change the formatting on all the tick marks.

#### Parameters​

• tickMarks: readonly TickMark[]

`TickMark`
array of tick marks

#### Returns​

boolean

`boolean`
boolean

- Type parametersMethodsoptions()setOptions()preprocessData()convertHorzItemToInternal()createConverterToInternalObj()key()cacheKey()updateFormatter()formatHorzItem()formatTickmark()maxTickMarkWeight()fillWeightsForPoints()shouldResetTickmarkLabels()?

- options()setOptions()preprocessData()convertHorzItemToInternal()createConverterToInternalObj()key()cacheKey()updateFormatter()formatHorzItem()formatTickmark()maxTickMarkWeight()fillWeightsForPoints()shouldResetTickmarkLabels()?

---

# lightweight-charts docs api interfaces LineStyleOptions

Represents style options for a line series.

## Properties​

### color​

color: string

`string`
Line color.

#### Default Value​

'#2196f3'

`'#2196f3'`
### lineStyle​

lineStyle: LineStyle

`LineStyle`
Line style.

#### Default Value​

```text
{@link LineStyle.Solid}
```

### lineWidth​

lineWidth: LineWidth

`LineWidth`
Line width in pixels.

#### Default Value​

3

`3`
### lineType​

lineType: LineType

`LineType`
Line type.

#### Default Value​

```text
{@link LineType.Simple}
```

### lineVisible​

lineVisible: boolean

`boolean`
Show series line.

#### Default Value​

true

`true`
### pointMarkersVisible​

pointMarkersVisible: boolean

`boolean`
Show circle markers on each point.

#### Default Value​

false

`false`
### pointMarkersRadius?​

optional pointMarkersRadius: number

`optional`
`number`
Circle markers radius in pixels.

#### Default Value​

undefined

`undefined`
### crosshairMarkerVisible​

crosshairMarkerVisible: boolean

`boolean`
Show the crosshair marker.

#### Default Value​

true

`true`
### crosshairMarkerRadius​

crosshairMarkerRadius: number

`number`
Crosshair marker radius in pixels.

#### Default Value​

4

`4`
### crosshairMarkerBorderColor​

crosshairMarkerBorderColor: string

`string`
Crosshair marker border color. An empty string falls back to the color of the series under the crosshair.

#### Default Value​

''

`''`
### crosshairMarkerBackgroundColor​

crosshairMarkerBackgroundColor: string

`string`
The crosshair marker background color. An empty string falls back to the color of the series under the crosshair.

#### Default Value​

''

`''`
### crosshairMarkerBorderWidth​

crosshairMarkerBorderWidth: number

`number`
Crosshair marker border width in pixels.

#### Default Value​

2

`2`
### lastPriceAnimation​

lastPriceAnimation: LastPriceAnimationMode

`LastPriceAnimationMode`
Last price animation mode.

#### Default Value​

```text
{@link LastPriceAnimationMode.Disabled}
```

- PropertiescolorlineStylelineWidthlineTypelineVisiblepointMarkersVisiblepointMarkersRadius?crosshairMarkerVisiblecrosshairMarkerRadiuscrosshairMarkerBorderColorcrosshairMarkerBackgroundColorcrosshairMarkerBorderWidthlastPriceAnimation

- colorlineStylelineWidthlineTypelineVisiblepointMarkersVisiblepointMarkersRadius?crosshairMarkerVisiblecrosshairMarkerRadiuscrosshairMarkerBorderColorcrosshairMarkerBackgroundColorcrosshairMarkerBorderWidthlastPriceAnimation

---

# lightweight-charts docs api interfaces AreaStyleOptions

Represents style options for an area series.

## Properties​

### topColor​

topColor: string

`string`
Color of the top part of the area.

#### Default Value​

'rgba( 46, 220, 135, 0.4)'

`'rgba( 46, 220, 135, 0.4)'`
### bottomColor​

bottomColor: string

`string`
Color of the bottom part of the area.

#### Default Value​

'rgba( 40, 221, 100, 0)'

`'rgba( 40, 221, 100, 0)'`
### relativeGradient​

relativeGradient: boolean

`boolean`
Gradient is relative to the base value and the currently visible range.
If it is false, the gradient is relative to the top and bottom of the chart.

#### Default Value​

false

`false`
### invertFilledArea​

invertFilledArea: boolean

`boolean`
Invert the filled area. Fills the area above the line if set to true.

#### Default Value​

false

`false`
### lineColor​

lineColor: string

`string`
Line color.

#### Default Value​

'#33D778'

`'#33D778'`
### lineStyle​

lineStyle: LineStyle

`LineStyle`
Line style.

#### Default Value​

```text
{@link LineStyle.Solid}
```

### lineWidth​

lineWidth: LineWidth

`LineWidth`
Line width in pixels.

#### Default Value​

3

`3`
### lineType​

lineType: LineType

`LineType`
Line type.

#### Default Value​

```text
{@link LineType.Simple}
```

### lineVisible​

lineVisible: boolean

`boolean`
Show series line.

#### Default Value​

true

`true`
### pointMarkersVisible​

pointMarkersVisible: boolean

`boolean`
Show circle markers on each point.

#### Default Value​

false

`false`
### pointMarkersRadius?​

optional pointMarkersRadius: number

`optional`
`number`
Circle markers radius in pixels.

#### Default Value​

undefined

`undefined`
### crosshairMarkerVisible​

crosshairMarkerVisible: boolean

`boolean`
Show the crosshair marker.

#### Default Value​

true

`true`
### crosshairMarkerRadius​

crosshairMarkerRadius: number

`number`
Crosshair marker radius in pixels.

#### Default Value​

4

`4`
### crosshairMarkerBorderColor​

crosshairMarkerBorderColor: string

`string`
Crosshair marker border color. An empty string falls back to the color of the series under the crosshair.

#### Default Value​

''

`''`
### crosshairMarkerBackgroundColor​

crosshairMarkerBackgroundColor: string

`string`
The crosshair marker background color. An empty string falls back to the color of the series under the crosshair.

#### Default Value​

''

`''`
### crosshairMarkerBorderWidth​

crosshairMarkerBorderWidth: number

`number`
Crosshair marker border width in pixels.

#### Default Value​

2

`2`
### lastPriceAnimation​

lastPriceAnimation: LastPriceAnimationMode

`LastPriceAnimationMode`
Last price animation mode.

#### Default Value​

```text
{@link LastPriceAnimationMode.Disabled}
```

- PropertiestopColorbottomColorrelativeGradientinvertFilledArealineColorlineStylelineWidthlineTypelineVisiblepointMarkersVisiblepointMarkersRadius?crosshairMarkerVisiblecrosshairMarkerRadiuscrosshairMarkerBorderColorcrosshairMarkerBackgroundColorcrosshairMarkerBorderWidthlastPriceAnimation

- topColorbottomColorrelativeGradientinvertFilledArealineColorlineStylelineWidthlineTypelineVisiblepointMarkersVisiblepointMarkersRadius?crosshairMarkerVisiblecrosshairMarkerRadiuscrosshairMarkerBorderColorcrosshairMarkerBackgroundColorcrosshairMarkerBorderWidthlastPriceAnimation

---

# lightweight-charts docs api interfaces SeriesOptionsCommon

Represents options common for all types of series

## Properties​

### lastValueVisible​

lastValueVisible: boolean

`boolean`
Visibility of the label with the latest visible price on the price scale.

#### Default Value​

true, false for yield curve charts

`true`
`false`
### title​

title: string

`string`
You can name series when adding it to a chart. This name will be displayed on the label next to the last value label.

#### Default Value​

''

`''`
### priceScaleId?​

optional priceScaleId: string

`optional`
`string`
Target price scale to bind new series to.

#### Default Value​

'right' if right scale is visible and 'left' otherwise

`'right'`
`'left'`
### visible​

visible: boolean

`boolean`
Visibility of the series.
If the series is hidden, everything including price lines, baseline, price labels and markers, will also be hidden.
Please note that hiding a series is not equivalent to deleting it, since hiding does not affect the timeline at all, unlike deleting where the timeline can be changed (some points can be deleted).

#### Default Value​

true

`true`
### priceLineVisible​

priceLineVisible: boolean

`boolean`
Show the price line. Price line is a horizontal line indicating the last price of the series.

#### Default Value​

true, false for yield curve charts

`true`
`false`
### priceLineSource​

priceLineSource: PriceLineSource

`PriceLineSource`
The source to use for the value of the price line.

#### Default Value​

```text
{@link PriceLineSource.LastBar}
```

### priceLineWidth​

priceLineWidth: LineWidth

`LineWidth`
Width of the price line.

#### Default Value​

1

`1`
### priceLineColor​

priceLineColor: string

`string`
Color of the price line.
By default, its color is set by the last bar color (or by line color on Line and Area charts).

#### Default Value​

''

`''`
### priceLineStyle​

priceLineStyle: LineStyle

`LineStyle`
Price line style.

#### Default Value​

```text
{@link LineStyle.Dashed}
```

### priceFormat​

priceFormat: PriceFormat

`PriceFormat`
Price format.

#### Default Value​

{ type: 'price', precision: 2, minMove: 0.01 }

`{ type: 'price', precision: 2, minMove: 0.01 }`
### baseLineVisible​

baseLineVisible: boolean

`boolean`
Visibility of base line. Suitable for percentage and IndexedTo100 scales.

`IndexedTo100`
#### Default Value​

true

`true`
### baseLineColor​

baseLineColor: string

`string`
Color of the base line in IndexedTo100 mode.

`IndexedTo100`
#### Default Value​

'#B2B5BE'

`'#B2B5BE'`
### baseLineWidth​

baseLineWidth: LineWidth

`LineWidth`
Base line width. Suitable for percentage and IndexedTo10 scales.

`IndexedTo10`
#### Default Value​

1

`1`
### baseLineStyle​

baseLineStyle: LineStyle

`LineStyle`
Base line style. Suitable for percentage and indexedTo100 scales.

#### Default Value​

```text
{@link LineStyle.Solid}
```

### autoscaleInfoProvider?​

optional autoscaleInfoProvider: AutoscaleInfoProvider

`optional`
`AutoscaleInfoProvider`
Override the default AutoscaleInfo provider.
By default, the chart scales data automatically based on visible data range.
However, for some reasons one could require overriding this behavior.

#### Default Value​

undefined

`undefined`
#### Examples​

```text
const firstSeries = chart.addSeries(LineSeries, {    autoscaleInfoProvider: () => ({        priceRange: {            minValue: 0,            maxValue: 100,        },    }),});
```

```text
const firstSeries = chart.addSeries(LineSeries, {    autoscaleInfoProvider: () => ({        priceRange: {            minValue: 0,            maxValue: 100,        },        margins: {            above: 10,            below: 10,        },    }),});
```

```text
const firstSeries = chart.addSeries(LineSeries, {    autoscaleInfoProvider: original => {        const res = original();        if (res !== null) {            res.priceRange.minValue -= 10;            res.priceRange.maxValue += 10;        }        return res;    },});
```

- PropertieslastValueVisibletitlepriceScaleId?visiblepriceLineVisiblepriceLineSourcepriceLineWidthpriceLineColorpriceLineStylepriceFormatbaseLineVisiblebaseLineColorbaseLineWidthbaseLineStyleautoscaleInfoProvider?

- lastValueVisibletitlepriceScaleId?visiblepriceLineVisiblepriceLineSourcepriceLineWidthpriceLineColorpriceLineStylepriceFormatbaseLineVisiblebaseLineColorbaseLineWidthbaseLineStyleautoscaleInfoProvider?

---

# lightweight-charts docs api interfaces WhitespaceData

Represents a whitespace data item, which is a data point without a value.

## Example​

```text
const data = [    { time: '2018-12-03', value: 27.02 },    { time: '2018-12-04' }, // whitespace    { time: '2018-12-05' }, // whitespace    { time: '2018-12-06' }, // whitespace    { time: '2018-12-07' }, // whitespace    { time: '2018-12-08', value: 23.92 },    { time: '2018-12-13', value: 30.74 },];
```

## Extended by​

- OhlcData

- SingleValueData

`OhlcData`
`SingleValueData`
## Type parameters​

• HorzScaleItem = Time

`Time`
## Properties​

### time​

time: HorzScaleItem

`HorzScaleItem`
The time of the data.

### customValues?​

optional customValues: Record<string, unknown>

`optional`
`Record`
`string`
`unknown`
Additional custom values which will be ignored by the library, but
could be used by plugins.

- ExampleExtended byType parametersPropertiestimecustomValues?

- timecustomValues?

---

# lightweight-charts docs api type-aliases CustomSeriesOptions

CustomSeriesOptions: SeriesOptions <CustomStyleOptions>

`SeriesOptions`
`CustomStyleOptions`
Represents a custom series options.

---

# lightweight-charts docs api interfaces CustomStyleOptions

Represents style options for a custom series.

## Properties​

### color​

color: string

`string`
Color used for the price line and price scale label.

- Propertiescolor

- color

---

# lightweight-charts docs api type-aliases HistogramSeriesOptions

HistogramSeriesOptions: SeriesOptions <HistogramStyleOptions>

`SeriesOptions`
`HistogramStyleOptions`
Represents histogram series options.

---

# lightweight-charts docs api interfaces CandlestickStyleOptions

Represents style options for a candlestick series.

## Properties​

### upColor​

upColor: string

`string`
Color of rising candles.

#### Default Value​

'#26a69a'

`'#26a69a'`
### downColor​

downColor: string

`string`
Color of falling candles.

#### Default Value​

'#ef5350'

`'#ef5350'`
### wickVisible​

wickVisible: boolean

`boolean`
Enable high and low prices candle wicks.

#### Default Value​

true

`true`
### borderVisible​

borderVisible: boolean

`boolean`
Enable candle borders.

#### Default Value​

true

`true`
### borderColor​

borderColor: string

`string`
Border color.

#### Default Value​

'#378658'

`'#378658'`
### borderUpColor​

borderUpColor: string

`string`
Border color of rising candles.

#### Default Value​

'#26a69a'

`'#26a69a'`
### borderDownColor​

borderDownColor: string

`string`
Border color of falling candles.

#### Default Value​

'#ef5350'

`'#ef5350'`
### wickColor​

wickColor: string

`string`
Wick color.

#### Default Value​

'#737375'

`'#737375'`
### wickUpColor​

wickUpColor: string

`string`
Wick color of rising candles.

#### Default Value​

'#26a69a'

`'#26a69a'`
### wickDownColor​

wickDownColor: string

`string`
Wick color of falling candles.

#### Default Value​

'#ef5350'

`'#ef5350'`
- PropertiesupColordownColorwickVisibleborderVisibleborderColorborderUpColorborderDownColorwickColorwickUpColorwickDownColor

- upColordownColorwickVisibleborderVisibleborderColorborderUpColorborderDownColorwickColorwickUpColorwickDownColor

---

# lightweight-charts docs api interfaces BarStyleOptions

Represents style options for a bar series.

## Properties​

### upColor​

upColor: string

`string`
Color of rising bars.

#### Default Value​

'#26a69a'

`'#26a69a'`
### downColor​

downColor: string

`string`
Color of falling bars.

#### Default Value​

'#ef5350'

`'#ef5350'`
### openVisible​

openVisible: boolean

`boolean`
Show open lines on bars.

#### Default Value​

true

`true`
### thinBars​

thinBars: boolean

`boolean`
Show bars as sticks.

#### Default Value​

true

`true`
- PropertiesupColordownColoropenVisiblethinBars

- upColordownColoropenVisiblethinBars

---

# lightweight-charts docs api type-aliases DeepPartial

DeepPartial<T>: { [P in keyof T]?: T[P] extends (infer U)[] ? DeepPartial<U>[] : T[P] extends readonly (infer X)[] ? readonly DeepPartial<X>[] : DeepPartial<T[P]> }

`T`
`{ [P in keyof T]?: T[P] extends (infer U)[] ? DeepPartial<U>[] : T[P] extends readonly (infer X)[] ? readonly DeepPartial<X>[] : DeepPartial<T[P]> }`
Represents a type T where every property is optional.

`T`
## Type parameters​

• T

- Type parameters

---

# lightweight-charts docs api interfaces TimeChartOptions

Options for chart with time at the horizontal scale

## Extends​

- ChartOptionsImpl <Time>

`ChartOptionsImpl`
`Time`
## Properties​

### width​

width: number

`number`
Width of the chart in pixels

#### Default Value​

If 0 (default) or none value provided, then a size of the widget will be calculated based its container's size.

`0`
#### Inherited from​

ChartOptionsImpl . width

`ChartOptionsImpl`
`width`
### height​

height: number

`number`
Height of the chart in pixels

#### Default Value​

If 0 (default) or none value provided, then a size of the widget will be calculated based its container's size.

`0`
#### Inherited from​

ChartOptionsImpl . height

`ChartOptionsImpl`
`height`
### autoSize​

autoSize: boolean

`boolean`
Setting this flag to true will make the chart watch the chart container's size and automatically resize the chart to fit its container whenever the size changes.

`true`
This feature requires ResizeObserver class to be available in the global scope.
Note that calling code is responsible for providing a polyfill if required. If the global scope does not have ResizeObserver, a warning will appear and the flag will be ignored.

`ResizeObserver`
`ResizeObserver`
Please pay attention that autoSize option and explicit sizes options width and height don't conflict with one another.
If you specify autoSize flag, then width and height options will be ignored unless ResizeObserver has failed. If it fails then the values will be used as fallback.

`autoSize`
`width`
`height`
`autoSize`
`width`
`height`
`ResizeObserver`
The flag autoSize could also be set with and unset with applyOptions function.

`autoSize`
`applyOptions`
```text
const chart = LightweightCharts.createChart(document.body, {    autoSize: true,});
```

#### Inherited from​

ChartOptionsImpl . autoSize

`ChartOptionsImpl`
`autoSize`
### layout​

layout: LayoutOptions

`LayoutOptions`
Layout options

#### Inherited from​

ChartOptionsImpl . layout

`ChartOptionsImpl`
`layout`
### leftPriceScale​

leftPriceScale: PriceScaleOptions

`PriceScaleOptions`
Left price scale options

#### Inherited from​

ChartOptionsImpl . leftPriceScale

`ChartOptionsImpl`
`leftPriceScale`
### rightPriceScale​

rightPriceScale: PriceScaleOptions

`PriceScaleOptions`
Right price scale options

#### Inherited from​

ChartOptionsImpl . rightPriceScale

`ChartOptionsImpl`
`rightPriceScale`
### overlayPriceScales​

overlayPriceScales: OverlayPriceScaleOptions

`OverlayPriceScaleOptions`
Overlay price scale options

#### Inherited from​

ChartOptionsImpl . overlayPriceScales

`ChartOptionsImpl`
`overlayPriceScales`
### crosshair​

crosshair: CrosshairOptions

`CrosshairOptions`
The crosshair shows the intersection of the price and time scale values at any point on the chart.

#### Inherited from​

ChartOptionsImpl . crosshair

`ChartOptionsImpl`
`crosshair`
### grid​

grid: GridOptions

`GridOptions`
A grid is represented in the chart background as a vertical and horizontal lines drawn at the levels of visible marks of price and the time scales.

#### Inherited from​

ChartOptionsImpl . grid

`ChartOptionsImpl`
`grid`
### handleScroll​

handleScroll: boolean | HandleScrollOptions

`boolean`
`HandleScrollOptions`
Scroll options, or a boolean flag that enables/disables scrolling

#### Inherited from​

ChartOptionsImpl . handleScroll

`ChartOptionsImpl`
`handleScroll`
### handleScale​

handleScale: boolean | HandleScaleOptions

`boolean`
`HandleScaleOptions`
Scale options, or a boolean flag that enables/disables scaling

#### Inherited from​

ChartOptionsImpl . handleScale

`ChartOptionsImpl`
`handleScale`
### kineticScroll​

kineticScroll: KineticScrollOptions

`KineticScrollOptions`
Kinetic scroll options

#### Inherited from​

ChartOptionsImpl . kineticScroll

`ChartOptionsImpl`
`kineticScroll`
### trackingMode​

trackingMode: TrackingModeOptions

`TrackingModeOptions`
Represent options for the tracking mode's behavior.

Mobile users will not have the ability to see the values/dates like they do on desktop.
To see it, they should enter the tracking mode. The tracking mode will deactivate the scrolling
and make it possible to check values and dates.

#### Inherited from​

ChartOptionsImpl . trackingMode

`ChartOptionsImpl`
`trackingMode`
### addDefaultPane​

addDefaultPane: boolean

`boolean`
Whether to add a default pane to the chart
Disable this option when you want to create a chart with no panes and add them manually

#### Default Value​

true

`true`
#### Inherited from​

ChartOptionsImpl . addDefaultPane

`ChartOptionsImpl`
`addDefaultPane`
### localization​

localization: LocalizationOptions <Time>

`LocalizationOptions`
`Time`
Localization options.

#### Inherited from​

ChartOptionsImpl . localization

`ChartOptionsImpl`
`localization`
### timeScale​

timeScale: TimeScaleOptions

`TimeScaleOptions`
Extended time scale options with option to override tickMarkFormatter

#### Overrides​

ChartOptionsImpl . timeScale

`ChartOptionsImpl`
`timeScale`
- ExtendsPropertieswidthheightautoSizelayoutleftPriceScalerightPriceScaleoverlayPriceScalescrosshairgridhandleScrollhandleScalekineticScrolltrackingModeaddDefaultPanelocalizationtimeScale

- widthheightautoSizelayoutleftPriceScalerightPriceScaleoverlayPriceScalescrosshairgridhandleScrollhandleScalekineticScrolltrackingModeaddDefaultPanelocalizationtimeScale

---

# lightweight-charts docs api type-aliases CandlestickSeriesOptions

CandlestickSeriesOptions: SeriesOptions <CandlestickStyleOptions>

`SeriesOptions`
`CandlestickStyleOptions`
Represents candlestick series options.

---

# lightweight-charts docs api interfaces IPriceScaleApi

Interface to control chart's price scale

## Methods​

### applyOptions()​

applyOptions(options): void

`options`
`void`
Applies new options to the price scale

#### Parameters​

• options: DeepPartial <PriceScaleOptions>

`DeepPartial`
`PriceScaleOptions`
Any subset of options.

#### Returns​

void

`void`
### options()​

options(): Readonly <PriceScaleOptions>

`Readonly`
`PriceScaleOptions`
Returns currently applied options of the price scale

#### Returns​

Readonly <PriceScaleOptions>

`Readonly`
`PriceScaleOptions`
Full set of currently applied options, including defaults

### width()​

width(): number

`number`
Returns a width of the price scale if it's visible or 0 if invisible.

#### Returns​

number

`number`
### setVisibleRange()​

setVisibleRange(range): void

`range`
`void`
Sets the visible range of the price scale.

#### Parameters​

• range: IRange<number>

`IRange`
`number`
The visible range to set, with from and to properties.

`from`
`to`
#### Returns​

void

`void`
### getVisibleRange()​

getVisibleRange(): IRange<number>

`IRange`
`number`
Returns the visible range of the price scale.

#### Returns​

IRange<number>

`IRange`
`number`
The visible range of the price scale, or null if the range is not set.

### setAutoScale()​

setAutoScale(on): void

`on`
`void`
Sets the auto scale mode of the price scale.

#### Parameters​

• on: boolean

`boolean`
If true, enables auto scaling; if false, disables it.

#### Returns​

void

`void`
- MethodsapplyOptions()options()width()setVisibleRange()getVisibleRange()setAutoScale()

- applyOptions()options()width()setVisibleRange()getVisibleRange()setAutoScale()

---

# lightweight-charts docs api type-aliases BarPrice

BarPrice: Nominal<number, "BarPrice">

`Nominal`
`number`
`"BarPrice"`
Represents a price as a number.

`number`

---

# lightweight-charts docs api type-aliases CreatePriceLineOptions

CreatePriceLineOptions: Partial <PriceLineOptions> & Pick <PriceLineOptions, "price">

`Partial`
`PriceLineOptions`
`Pick`
`PriceLineOptions`
`"price"`
Price line options for the ISeriesApi.createPriceLine method.

price is required, while the rest of the options are optional.

`price`

---

# lightweight-charts docs api type-aliases DataChangedHandler

DataChangedHandler: (scope) => void

`scope`
`void`
A custom function use to handle data changed events.

## Parameters​

• scope: DataChangedScope

`DataChangedScope`
## Returns​

void

`void`
- ParametersReturns

---

# lightweight-charts docs api type-aliases Coordinate

Coordinate: Nominal<number, "Coordinate">

`Nominal`
`number`
`"Coordinate"`
Represents a coordiate as a number.

`number`

---

# lightweight-charts docs api type-aliases LastValueDataResult

LastValueDataResult: LastValueDataResultWithData | LastValueDataResultWithoutData

`LastValueDataResultWithData`
`LastValueDataResultWithoutData`
Represents last value data result of a series for plugins

---

# lightweight-charts docs api interfaces IRange

Represents a generic range from one value to another.

`from`
`to`
## Type parameters​

• T

## Properties​

### from​

from: T

`T`
The from value. The start of the range.

### to​

to: T

`T`
The to value. The end of the range.

- Type parametersPropertiesfromto

- fromto

---

# lightweight-charts docs api interfaces BarsInfo

Represents a range of bars and the number of bars outside the range.

## Extends​

- Partial <IRange<HorzScaleItem>>

`Partial`
`IRange`
`HorzScaleItem`
## Type parameters​

• HorzScaleItem

## Properties​

### barsBefore​

barsBefore: number

`number`
The number of bars before the start of the range.
Positive value means that there are some bars before (out of logical range from the left) the IRange.from logical index in the series.
Negative value means that the first series' bar is inside the passed logical range, and between the first series' bar and the IRange.from logical index are some bars.

### barsAfter​

barsAfter: number

`number`
The number of bars after the end of the range.
Positive value in the barsAfter field means that there are some bars after (out of logical range from the right) the IRange.to logical index in the series.
Negative value means that the last series' bar is inside the passed logical range, and between the last series' bar and the IRange.to logical index are some bars.

`barsAfter`
### from?​

optional from: HorzScaleItem

`optional`
`HorzScaleItem`
The from value. The start of the range.

#### Inherited from​

Partial.from

`Partial.from`
### to?​

optional to: HorzScaleItem

`optional`
`HorzScaleItem`
The to value. The end of the range.

#### Inherited from​

Partial.to

`Partial.to`
- ExtendsType parametersPropertiesbarsBeforebarsAfterfrom?to?

- barsBeforebarsAfterfrom?to?

---

# lightweight-charts docs api type-aliases SeriesType

SeriesType: keyof SeriesOptionsMap

`SeriesOptionsMap`
Represents a type of series.

## See​

SeriesOptionsMap

- See

---

# lightweight-charts docs time-scale

## Overview​

Time scale (or time axis) is a horizontal scale that displays the time of data points at the bottom of the chart.

The horizontal scale can also represent price or other custom values. Refer to the Chart types article for more information.

### Time scale appearance​

Use TimeScaleOptions to adjust the time scale appearance. You can specify these options in two ways:

`TimeScaleOptions`
- On chart initialization. To do this, provide the desired options as a timeScale parameter when calling createChart.

- On the fly using either the ITimeScaleApi.applyOptions or IChartApi.applyOptions method. Both methods produce the same result.

`timeScale`
`createChart`
`ITimeScaleApi.applyOptions`
`IChartApi.applyOptions`
### Time scale API​

Call the IChartApi.timeScale method to get an instance of the ITimeScaleApi interface. This interface provides an extensive API for controlling the time scale. For example, you can adjust the visible range, convert a time point or index to a coordinate, and subscribe to events.

`IChartApi.timeScale`
`ITimeScaleApi`
```text
chart.timeScale().resetTimeScale();
```

## Visible range​

Visible range is a chart area that is currently visible on the canvas. This area can be measured with both data and logical range.
Data range usually includes bar timestamps, while logical range has bar indices.

You can adjust the visible range using the following methods:

- setVisibleRange

- getVisibleRange

- setVisibleLogicalRange

- getVisibleLogicalRange

`setVisibleRange`
`getVisibleRange`
`setVisibleLogicalRange`
`getVisibleLogicalRange`
### Data range​

The data range includes only values from the first to the last bar visible on the chart. If the visible area has empty space, this part of the scale is not included in the data range.

Note that you cannot extrapolate time with the setVisibleRange method. For example, the chart does not have data prior 2018-01-01 date. If you set the visible range from 2016-01-01, it will be automatically adjusted to 2018-01-01.

`setVisibleRange`
`2018-01-01`
`2016-01-01`
`2018-01-01`
If you want to adjust the visible range more flexible, operate with the logical range instead.

### Logical range​

The logical range represents a continuous line of values. These values are logical indices on the scale that illustrated as red lines in the image below:

The logical range starts from the first data point across all series, with negative indices before it and positive ones after.

The indices can have fractional parts. The integer part represents the fully visible bar, while the fractional part indicates partial visibility. For example, the 5.2 index means that the fifth bar is fully visible, while the sixth bar is 20% visible.
A half-index, such as 3.5, represents the middle of the bar.

`5.2`
`3.5`
In the library, the logical range is represented with the LogicalRange object. This object has the from and to properties, which are logical indices on the time scale. For example, the visible logical range on the chart above is approximately from -4.73 to 5.05.

`LogicalRange`
`from`
`to`
`-4.73`
`5.05`
The setVisibleLogicalRange method allows you to specify the visible range beyond the bounds of the available data. This can be useful for setting a chart margin or aligning series visually.

`setVisibleLogicalRange`
## Chart margin​

Margin is the space between the chart's borders and the series. It depends on the following time scale options:

- barSpacing. The default value is 6.

- rightOffset. The default value is 0.

`barSpacing`
`6`
`rightOffset`
`0`
You can specify these options as described in above.

Note that if a series contains only a few data points, the chart may have a large margin on the left side.

In this case, you can call the fitContent method that adjust the view and fits all data within the chart.

`fitContent`
```text
chart.timeScale().fitContent();
```

If calling fitContent has no effect, it might be due to how the library displays data.

`fitContent`
The library allocates specific width for each data point to maintain consistency between different chart types.
For example, for line series, the plot point is placed at the center of this allocated space, while candlestick series use most of the width for the candle body.
The allocated space for each data point is proportional to the chart width.
As a result, series with fewer data points may have a small margin on both sides.

You can specify the logical range with the setVisibleLogicalRange method to display the series exactly to the edges.
For example, the code sample below adjusts the range by half a bar-width on both sides.

`setVisibleLogicalRange`
```text
const vr = chart.timeScale().getVisibleLogicalRange();chart.timeScale().setVisibleLogicalRange({ from: vr.from + 0.5, to: vr.to - 0.5 });
```

- OverviewTime scale appearanceTime scale APIVisible rangeData rangeLogical rangeChart margin

- Time scale appearanceTime scale API

- Data rangeLogical range

---

# lightweight-charts docs api interfaces IPriceLine

Represents the interface for interacting with price lines.

## Methods​

### applyOptions()​

applyOptions(options): void

`options`
`void`
Apply options to the price line.

#### Parameters​

• options: Partial <PriceLineOptions>

`Partial`
`PriceLineOptions`
Any subset of options.

#### Returns​

void

`void`
#### Example​

```text
priceLine.applyOptions({    price: 90.0,    color: 'red',    lineWidth: 3,    lineStyle: LightweightCharts.LineStyle.Dashed,    axisLabelVisible: false,    title: 'P/L 600',});
```

### options()​

options(): Readonly <PriceLineOptions>

`Readonly`
`PriceLineOptions`
Get the currently applied options.

#### Returns​

Readonly <PriceLineOptions>

`Readonly`
`PriceLineOptions`
- MethodsapplyOptions()options()

- applyOptions()options()

---

# lightweight-charts docs api type-aliases ISeriesPrimitive

ISeriesPrimitive<HorzScaleItem>: ISeriesPrimitiveBase <SeriesAttachedParameter<HorzScaleItem, SeriesType>>

`HorzScaleItem`
`ISeriesPrimitiveBase`
`SeriesAttachedParameter`
`HorzScaleItem`
`SeriesType`
Interface for series primitives. It must be implemented to add some external graphics to series.

## Type parameters​

• HorzScaleItem = Time

`Time`
- Type parameters

---

# lightweight-charts docs api enumerations MismatchDirection

Search direction if no data found at provided index

## Enumeration Members​

### NearestLeft​

NearestLeft: -1

`-1`
Search the nearest left item

### None​

None: 0

`0`
Do not search

### NearestRight​

NearestRight: 1

`1`
Search the nearest right item

- Enumeration MembersNearestLeftNoneNearestRight

- NearestLeftNoneNearestRight

---

# lightweight-charts docs api interfaces IPriceFormatter

Interface to be implemented by the object in order to be used as a price formatter

## Methods​

### format()​

format(price): string

`price`
`string`
Formatting function

#### Parameters​

• price: number

`number`
Original price to be formatted

#### Returns​

string

`string`
Formatted price

### formatTickmarks()​

formatTickmarks(prices): string[]

`prices`
`string`
A formatting function for price scale tick marks. Use this function to define formatting rules based on all provided price values.

#### Parameters​

• prices: readonly number[]

`number`
Prices to be formatted

#### Returns​

string[]

`string`
Formatted prices

- Methodsformat()formatTickmarks()

- format()formatTickmarks()

---

# lightweight-charts docs plugins intro

Plugins allow you to extend the library's functionality and render custom elements, such as new series, drawing tools, indicators, and watermarks.

You can create plugins of the following types:

- Custom series — define new types of series.

- Primitives — define custom visualizations, drawing tools, and
chart annotations that can be attached to an existing series (series primitives) or chart pane (pane primitives).

- Use the create-lwc-plugin npm package to quickly scaffold a project for your custom plugin.

- Explore the Plugin Examples Demo page that hosts interactive examples of heatmaps, alerts, watermarks, and tooltips implemented with plugins. You can find the code of these examples in the plugin-examples folder in the Lightweight Charts™ repository.

`plugin-examples`
## Custom series​

Custom series allow you to define new types of series with custom data structures and rendering logic.
For implementation details, refer to the Custom Series Types article.

Use the addCustomSeries method to add a custom series to the chart.
Then, you can manage it through the same API available for built-in series.
For example, call the setData method to populate the series with data.

`addCustomSeries`
`setData`
```text
class MyCustomSeries {    /* Class implementing the ICustomSeriesPaneView interface */}// Create an instantiated custom seriesconst customSeriesInstance = new MyCustomSeries();const chart = createChart(document.getElementById('container'));const myCustomSeries = chart.addCustomSeries(customSeriesInstance, {    // Options for MyCustomSeries    customOption: 10,});const data = [    { time: 1642425322, value: 123, customValue: 456 },    /* ... more data */];myCustomSeries.setData(data);
```

## Primitives​

Primitives allow you to define custom visualizations, drawing tools, and chart annotations. You can render them at different
levels in the visual stack to create complex, layered compositions.

### Series primitives​

Series primitives are attached to a specific series and can render on the main pane, price and
time scales. For implementation details, refer to the Series Primitives article.

Use the attachPrimitive method to add a primitive to the chart and attach it to the series.

`attachPrimitive`
```text
class MyCustomPrimitive {    /* Class implementing the ISeriesPrimitive interface */}// Create an instantiated series primitiveconst myCustomPrimitive = new MyCustomPrimitive();const chart = createChart(document.getElementById('container'));const lineSeries = chart.addSeries(LineSeries);const data = [    { time: 1642425322, value: 123 },    /* ... more data */];// Attach the primitive to the serieslineSeries.attachPrimitive(myCustomPrimitive);
```

### Pane primitives​

Pane primitives are attached to a chart pane rather than a specific series. You can use them to create chart-wide annotations and features like watermarks.
For implementation details, refer to the Pane Primitives article.

Note that pane primitives cannot render on the price or time scale.

Use the attachPrimitive method to add a primitive to the chart and attach it to the pane.

`attachPrimitive`
```text
class MyCustomPanePrimitive {    /* Class implementing the IPanePrimitive interface */}// Create an instantiated pane primitiveconst myCustomPanePrimitive = new MyCustomPanePrimitive();const chart = createChart(document.getElementById('container'));// Get the main paneconst mainPane = chart.panes()[0];// Attach the primitive to the panemainPane.attachPrimitive(myCustomPanePrimitive);
```

- Custom seriesPrimitivesSeries primitivesPane primitives

- Series primitivesPane primitives

---

# lightweight-charts docs api interfaces SingleValueData

A base interface for a data point of single-value series.

## Extends​

- WhitespaceData<HorzScaleItem>

`WhitespaceData`
`HorzScaleItem`
## Extended by​

- AreaData

- BaselineData

- HistogramData

- LineData

`AreaData`
`BaselineData`
`HistogramData`
`LineData`
## Type parameters​

• HorzScaleItem = Time

`Time`
## Properties​

### time​

time: HorzScaleItem

`HorzScaleItem`
The time of the data.

#### Overrides​

WhitespaceData . time

`WhitespaceData`
`time`
### value​

value: number

`number`
Price value of the data.

### customValues?​

optional customValues: Record<string, unknown>

`optional`
`Record`
`string`
`unknown`
Additional custom values which will be ignored by the library, but
could be used by plugins.

#### Inherited from​

WhitespaceData . customValues

`WhitespaceData`
`customValues`
- ExtendsExtended byType parametersPropertiestimevaluecustomValues?

- timevaluecustomValues?

---

# lightweight-charts docs api variables AreaSeries

const AreaSeries: SeriesDefinition<"Area">

`const`
`SeriesDefinition`
`"Area"`

---

# lightweight-charts docs api variables BarSeries

const BarSeries: SeriesDefinition<"Bar">

`const`
`SeriesDefinition`
`"Bar"`

---

# lightweight-charts docs api variables LineSeries

const LineSeries: SeriesDefinition<"Line">

`const`
`SeriesDefinition`
`"Line"`

---

# lightweight-charts docs api variables CandlestickSeries

const CandlestickSeries: SeriesDefinition<"Candlestick">

`const`
`SeriesDefinition`
`"Candlestick"`

---

# lightweight-charts docs api variables BaselineSeries

const BaselineSeries: SeriesDefinition<"Baseline">

`const`
`SeriesDefinition`
`"Baseline"`

---

# lightweight-charts docs api interfaces SeriesStyleOptionsMap

Represents the type of style options for each series type.

For example a bar series has style options represented by BarStyleOptions.

## Properties​

### Bar​

Bar: BarStyleOptions

`BarStyleOptions`
The type of bar style options.

### Candlestick​

Candlestick: CandlestickStyleOptions

`CandlestickStyleOptions`
The type of candlestick style options.

### Area​

Area: AreaStyleOptions

`AreaStyleOptions`
The type of area style options.

### Baseline​

Baseline: BaselineStyleOptions

`BaselineStyleOptions`
The type of baseline style options.

### Line​

Line: LineStyleOptions

`LineStyleOptions`
The type of line style options.

### Histogram​

Histogram: HistogramStyleOptions

`HistogramStyleOptions`
The type of histogram style options.

### Custom​

Custom: CustomStyleOptions

`CustomStyleOptions`
The type of a custom series' style options.

- PropertiesBarCandlestickAreaBaselineLineHistogramCustom

- BarCandlestickAreaBaselineLineHistogramCustom

---

# lightweight-charts docs api variables HistogramSeries

const HistogramSeries: SeriesDefinition<"Histogram">

`const`
`SeriesDefinition`
`"Histogram"`

---

# lightweight-charts docs api type-aliases LogicalRange

LogicalRange: IRange <Logical>

`IRange`
`Logical`
A logical range is an object with 2 properties: from and to, which are numbers and represent logical indexes on the time scale.

`from`
`to`
The starting point of the time scale's logical range is the first data item among all series.
Before that point all indexes are negative, starting from that point - positive.

Indexes might have fractional parts, for instance 4.2, due to the time-scale being continuous rather than discrete.

Integer part of the logical index means index of the fully visible bar.
Thus, if we have 5.2 as the last visible logical index (to field), that means that the last visible bar has index 5, but we also have partially visible (for 20%) 6th bar.
Half (e.g. 1.5, 3.5, 10.5) means exactly a middle of the bar.

`to`

---

# lightweight-charts docs api type-aliases SizeChangeEventHandler

SizeChangeEventHandler: (width, height) => void

`width`
`height`
`void`
A custom function used to handle changes to the time scale's size.

## Parameters​

• width: number

`number`
• height: number

`number`
## Returns​

void

`void`
- ParametersReturns

---

# lightweight-charts docs api type-aliases TimePointIndex

TimePointIndex: Nominal<number, "TimePointIndex">

`Nominal`
`number`
`"TimePointIndex"`
Index for a point on the horizontal (time) scale.

---

# lightweight-charts docs api type-aliases TimeRangeChangeEventHandler

TimeRangeChangeEventHandler<HorzScaleItem>: (timeRange) => void

`HorzScaleItem`
`timeRange`
`void`
A custom function used to handle changes to the time scale's time range.

## Type parameters​

• HorzScaleItem

## Parameters​

• timeRange: IRange<HorzScaleItem> | null

`IRange`
`HorzScaleItem`
`null`
## Returns​

void

`void`
- Type parametersParametersReturns

---

# lightweight-charts docs api type-aliases LogicalRangeChangeEventHandler

LogicalRangeChangeEventHandler: (logicalRange) => void

`logicalRange`
`void`
A custom function used to handle changes to the time scale's logical range.

## Parameters​

• logicalRange: LogicalRange | null

`LogicalRange`
`null`
## Returns​

void

`void`
- ParametersReturns

---

# lightweight-charts docs api type-aliases Logical

Logical: Nominal<number, "Logical">

`Nominal`
`number`
`"Logical"`
Represents the to or from number in a logical range.

`to`
`from`

---

# lightweight-charts docs api interfaces HorzScaleOptions

Options for the time scale; the horizontal scale at the bottom of the chart that displays the time of data.

## Extended by​

- TimeScaleOptions

`TimeScaleOptions`
## Properties​

### rightOffset​

rightOffset: number

`number`
The margin space in bars from the right side of the chart.

#### Default Value​

0

`0`
### rightOffsetPixels?​

optional rightOffsetPixels: number

`optional`
`number`
The margin space in pixels from the right side of the chart.
This option has priority over rightOffset.

`rightOffset`
#### Default Value​

undefined

`undefined`
### barSpacing​

barSpacing: number

`number`
The space between bars in pixels.

#### Default Value​

6

`6`
### minBarSpacing​

minBarSpacing: number

`number`
The minimum space between bars in pixels.

#### Default Value​

0.5

`0.5`
### maxBarSpacing​

maxBarSpacing: number

`number`
The maximum space between bars in pixels.

Has no effect if value is set to 0.

`0`
#### Default Value​

0

`0`
### fixLeftEdge​

fixLeftEdge: boolean

`boolean`
Prevent scrolling to the left of the first bar.

#### Default Value​

false

`false`
### fixRightEdge​

fixRightEdge: boolean

`boolean`
Prevent scrolling to the right of the most recent bar.

#### Default Value​

false

`false`
### lockVisibleTimeRangeOnResize​

lockVisibleTimeRangeOnResize: boolean

`boolean`
Prevent changing the visible time range during chart resizing.

#### Default Value​

false

`false`
### rightBarStaysOnScroll​

rightBarStaysOnScroll: boolean

`boolean`
Prevent the hovered bar from moving when scrolling.

#### Default Value​

false

`false`
### borderVisible​

borderVisible: boolean

`boolean`
Show the time scale border.

#### Default Value​

true

`true`
### borderColor​

borderColor: string

`string`
The time scale border color.

#### Default Value​

'#2B2B43'

`'#2B2B43'`
### visible​

visible: boolean

`boolean`
Show the time scale.

#### Default Value​

true

`true`
### timeVisible​

timeVisible: boolean

`boolean`
Show the time, not just the date, in the time scale and vertical crosshair label.

#### Default Value​

false

`false`
### secondsVisible​

secondsVisible: boolean

`boolean`
Show seconds in the time scale and vertical crosshair label in hh:mm:ss format for intraday data.

`hh:mm:ss`
#### Default Value​

true

`true`
### shiftVisibleRangeOnNewBar​

shiftVisibleRangeOnNewBar: boolean

`boolean`
Shift the visible range to the right (into the future) by the number of new bars when new data is added.

Note that this only applies when the last bar is visible.

#### Default Value​

true

`true`
### allowShiftVisibleRangeOnWhitespaceReplacement​

allowShiftVisibleRangeOnWhitespaceReplacement: boolean

`boolean`
Allow the visible range to be shifted to the right when a new bar is added which
is replacing an existing whitespace time point on the chart.

Note that this only applies when the last bar is visible & shiftVisibleRangeOnNewBar is enabled.

`shiftVisibleRangeOnNewBar`
#### Default Value​

false

`false`
### ticksVisible​

ticksVisible: boolean

`boolean`
Draw small vertical line on time axis labels.

#### Default Value​

false

`false`
### tickMarkMaxCharacterLength?​

optional tickMarkMaxCharacterLength: number

`optional`
`number`
Maximum tick mark label length. Used to override the default 8 character maximum length.

#### Default Value​

undefined

`undefined`
### uniformDistribution​

uniformDistribution: boolean

`boolean`
Changes horizontal scale marks generation.
With this flag equal to true, marks of the same weight are either all drawn or none are drawn at all.

`true`
### minimumHeight​

minimumHeight: number

`number`
Define a minimum height for the time scale.
Note: This value will be exceeded if the
time scale needs more space to display it's contents.

Setting a minimum height could be useful for ensuring that
multiple charts positioned in a horizontal stack each have
an identical time scale height, or for plugins which
require a bit more space within the time scale pane.

#### Default Value​

```text
0
```

### allowBoldLabels​

allowBoldLabels: boolean

`boolean`
Allow major time scale labels to be rendered in a bolder font weight.

#### Default Value​

```text
true
```

### ignoreWhitespaceIndices​

ignoreWhitespaceIndices: boolean

`boolean`
Ignore time scale points containing only whitespace (for all series) when
drawing grid lines, tick marks, and snapping the crosshair to time scale points.

For the yield curve chart type it defaults to true.

`true`
#### Default Value​

```text
false
```

- Extended byPropertiesrightOffsetrightOffsetPixels?barSpacingminBarSpacingmaxBarSpacingfixLeftEdgefixRightEdgelockVisibleTimeRangeOnResizerightBarStaysOnScrollborderVisibleborderColorvisibletimeVisiblesecondsVisibleshiftVisibleRangeOnNewBarallowShiftVisibleRangeOnWhitespaceReplacementticksVisibletickMarkMaxCharacterLength?uniformDistributionminimumHeightallowBoldLabelsignoreWhitespaceIndices

- rightOffsetrightOffsetPixels?barSpacingminBarSpacingmaxBarSpacingfixLeftEdgefixRightEdgelockVisibleTimeRangeOnResizerightBarStaysOnScrollborderVisibleborderColorvisibletimeVisiblesecondsVisibleshiftVisibleRangeOnNewBarallowShiftVisibleRangeOnWhitespaceReplacementticksVisibletickMarkMaxCharacterLength?uniformDistributionminimumHeightallowBoldLabelsignoreWhitespaceIndices

---

# lightweight-charts docs api type-aliases SeriesOptions

SeriesOptions<T>: T & SeriesOptionsCommon

`T`
`T`
`SeriesOptionsCommon`
Represents the intersection of a series type T's options and common series options.

`T`
## See​

SeriesOptionsCommon for common options.

## Type parameters​

• T

- SeeType parameters

---

# lightweight-charts docs api interfaces MouseEventParams

Represents a mouse event.

## Type parameters​

• HorzScaleItem = Time

`Time`
## Properties​

### time?​

optional time: HorzScaleItem

`optional`
`HorzScaleItem`
Time of the data at the location of the mouse event.

The value will be undefined if the location of the event in the chart is outside the range of available data.

`undefined`
### logical?​

optional logical: Logical

`optional`
`Logical`
Logical index

### point?​

optional point: Point

`optional`
`Point`
Location of the event in the chart.

The value will be undefined if the event is fired outside the chart, for example a mouse leave event.

`undefined`
### paneIndex?​

optional paneIndex: number

`optional`
`number`
The index of the Pane

### seriesData​

seriesData: Map <ISeriesApi<keyof SeriesOptionsMap, HorzScaleItem, AreaData<HorzScaleItem> | WhitespaceData<HorzScaleItem> | BarData<HorzScaleItem> | CandlestickData<HorzScaleItem> | BaselineData<HorzScaleItem> | LineData<HorzScaleItem> | HistogramData<HorzScaleItem> | CustomData<HorzScaleItem> | CustomSeriesWhitespaceData<HorzScaleItem>, CustomSeriesOptions | AreaSeriesOptions | BarSeriesOptions | CandlestickSeriesOptions | BaselineSeriesOptions | LineSeriesOptions | HistogramSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon> | DeepPartial <BarStyleOptions & SeriesOptionsCommon> | DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon> | DeepPartial <BaselineStyleOptions & SeriesOptionsCommon> | DeepPartial <LineStyleOptions & SeriesOptionsCommon> | DeepPartial <HistogramStyleOptions & SeriesOptionsCommon> | DeepPartial <CustomStyleOptions & SeriesOptionsCommon>>, BarData<HorzScaleItem> | LineData<HorzScaleItem> | HistogramData<HorzScaleItem> | CustomData<HorzScaleItem>>

`Map`
`ISeriesApi`
`SeriesOptionsMap`
`HorzScaleItem`
`AreaData`
`HorzScaleItem`
`WhitespaceData`
`HorzScaleItem`
`BarData`
`HorzScaleItem`
`CandlestickData`
`HorzScaleItem`
`BaselineData`
`HorzScaleItem`
`LineData`
`HorzScaleItem`
`HistogramData`
`HorzScaleItem`
`CustomData`
`HorzScaleItem`
`CustomSeriesWhitespaceData`
`HorzScaleItem`
`CustomSeriesOptions`
`AreaSeriesOptions`
`BarSeriesOptions`
`CandlestickSeriesOptions`
`BaselineSeriesOptions`
`LineSeriesOptions`
`HistogramSeriesOptions`
`DeepPartial`
`AreaStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`BarStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`CandlestickStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`BaselineStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`LineStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`HistogramStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`CustomStyleOptions`
`SeriesOptionsCommon`
`BarData`
`HorzScaleItem`
`LineData`
`HorzScaleItem`
`HistogramData`
`HorzScaleItem`
`CustomData`
`HorzScaleItem`
Data of all series at the location of the event in the chart.

Keys of the map are ISeriesApi instances. Values are prices.
Values of the map are original data items

### hoveredSeries?​

optional hoveredSeries: ISeriesApi<keyof SeriesOptionsMap, HorzScaleItem, AreaData<HorzScaleItem> | WhitespaceData<HorzScaleItem> | BarData<HorzScaleItem> | CandlestickData<HorzScaleItem> | BaselineData<HorzScaleItem> | LineData<HorzScaleItem> | HistogramData<HorzScaleItem> | CustomData<HorzScaleItem> | CustomSeriesWhitespaceData<HorzScaleItem>, CustomSeriesOptions | AreaSeriesOptions | BarSeriesOptions | CandlestickSeriesOptions | BaselineSeriesOptions | LineSeriesOptions | HistogramSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon> | DeepPartial <BarStyleOptions & SeriesOptionsCommon> | DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon> | DeepPartial <BaselineStyleOptions & SeriesOptionsCommon> | DeepPartial <LineStyleOptions & SeriesOptionsCommon> | DeepPartial <HistogramStyleOptions & SeriesOptionsCommon> | DeepPartial <CustomStyleOptions & SeriesOptionsCommon>>

`optional`
`ISeriesApi`
`SeriesOptionsMap`
`HorzScaleItem`
`AreaData`
`HorzScaleItem`
`WhitespaceData`
`HorzScaleItem`
`BarData`
`HorzScaleItem`
`CandlestickData`
`HorzScaleItem`
`BaselineData`
`HorzScaleItem`
`LineData`
`HorzScaleItem`
`HistogramData`
`HorzScaleItem`
`CustomData`
`HorzScaleItem`
`CustomSeriesWhitespaceData`
`HorzScaleItem`
`CustomSeriesOptions`
`AreaSeriesOptions`
`BarSeriesOptions`
`CandlestickSeriesOptions`
`BaselineSeriesOptions`
`LineSeriesOptions`
`HistogramSeriesOptions`
`DeepPartial`
`AreaStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`BarStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`CandlestickStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`BaselineStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`LineStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`HistogramStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`CustomStyleOptions`
`SeriesOptionsCommon`
The ISeriesApi for the series at the point of the mouse event.

### hoveredObjectId?​

optional hoveredObjectId: unknown

`optional`
`unknown`
The ID of the object at the point of the mouse event.

### sourceEvent?​

optional sourceEvent: TouchMouseEventData

`optional`
`TouchMouseEventData`
The underlying source mouse or touch event data, if available

- Type parametersPropertiestime?logical?point?paneIndex?seriesDatahoveredSeries?hoveredObjectId?sourceEvent?

- time?logical?point?paneIndex?seriesDatahoveredSeries?hoveredObjectId?sourceEvent?

---

# lightweight-charts docs api interfaces OhlcData

Represents a bar with a Time and open, high, low, and close prices.

## Extends​

- WhitespaceData<HorzScaleItem>

`WhitespaceData`
`HorzScaleItem`
## Extended by​

- BarData

- CandlestickData

`BarData`
`CandlestickData`
## Type parameters​

• HorzScaleItem = Time

`Time`
## Properties​

### time​

time: HorzScaleItem

`HorzScaleItem`
The bar time.

#### Overrides​

WhitespaceData . time

`WhitespaceData`
`time`
### open​

open: number

`number`
The open price.

### high​

high: number

`number`
The high price.

### low​

low: number

`number`
The low price.

### close​

close: number

`number`
The close price.

### customValues?​

optional customValues: Record<string, unknown>

`optional`
`Record`
`string`
`unknown`
Additional custom values which will be ignored by the library, but
could be used by plugins.

#### Inherited from​

WhitespaceData . customValues

`WhitespaceData`
`customValues`
- ExtendsExtended byType parametersPropertiestimeopenhighlowclosecustomValues?

- timeopenhighlowclosecustomValues?

---

# lightweight-charts docs api type-aliases IPanePrimitive

IPanePrimitive<HorzScaleItem>: IPanePrimitiveBase <PaneAttachedParameter<HorzScaleItem>>

`HorzScaleItem`
`IPanePrimitiveBase`
`PaneAttachedParameter`
`HorzScaleItem`
Interface for pane primitives. It must be implemented to add some external graphics to a pane.

## Type parameters​

• HorzScaleItem = Time

`Time`
- Type parameters

---

# lightweight-charts docs api type-aliases BarSeriesPartialOptions

BarSeriesPartialOptions: SeriesPartialOptions <BarStyleOptions>

`SeriesPartialOptions`
`BarStyleOptions`
Represents bar series options where all properties are options.

---

# lightweight-charts docs api type-aliases LineWidth

LineWidth: 1 | 2 | 3 | 4

`1`
`2`
`3`
`4`
Represents the width of a line.

---

# lightweight-charts docs api interfaces BaseValuePrice

Represents a type of priced base value of baseline series type.

## Properties​

### type​

type: "price"

`"price"`
Distinguished type value.

### price​

price: number

`number`
Price value.

- Propertiestypeprice

- typeprice

---

# lightweight-charts docs api enumerations LineStyle

Represents the possible line styles.

## Enumeration Members​

### Solid​

Solid: 0

`0`
A solid line.

### Dotted​

Dotted: 1

`1`
A dotted line.

### Dashed​

Dashed: 2

`2`
A dashed line.

### LargeDashed​

LargeDashed: 3

`3`
A dashed line with bigger dashes.

### SparseDotted​

SparseDotted: 4

`4`
A dotted line with more space between dots.

- Enumeration MembersSolidDottedDashedLargeDashedSparseDotted

- SolidDottedDashedLargeDashedSparseDotted

---

# lightweight-charts docs api enumerations LineType

Represents the possible line types.

## Enumeration Members​

### Simple​

Simple: 0

`0`
A line.

### WithSteps​

WithSteps: 1

`1`
A stepped line.

### Curved​

Curved: 2

`2`
A curved line.

- Enumeration MembersSimpleWithStepsCurved

- SimpleWithStepsCurved

---

# lightweight-charts docs api enumerations LastPriceAnimationMode

Represents the type of the last price animation for series such as area or line.

## Enumeration Members​

### Disabled​

Disabled: 0

`0`
Animation is always disabled

### Continuous​

Continuous: 1

`1`
Animation is always enabled.

### OnDataUpdate​

OnDataUpdate: 2

`2`
Animation is active after new data.

- Enumeration MembersDisabledContinuousOnDataUpdate

- DisabledContinuousOnDataUpdate

---

# lightweight-charts docs api interfaces BusinessDay

Represents a time as a day/month/year.

## Example​

```text
const day = { year: 2019, month: 6, day: 1 }; // June 1, 2019
```

## Properties​

### year​

year: number

`number`
The year.

### month​

month: number

`number`
The month.

### day​

day: number

`number`
The day.

- ExamplePropertiesyearmonthday

- yearmonthday

---

# lightweight-charts docs api type-aliases UTCTimestamp

UTCTimestamp: Nominal<number, "UTCTimestamp">

`Nominal`
`number`
`"UTCTimestamp"`
Represents a time as a UNIX timestamp.

If your chart displays an intraday interval you should use a UNIX Timestamp.

Note that JavaScript Date APIs like Date.now return a number of milliseconds but UTCTimestamp expects a number of seconds.

`Date.now`
Note that to prevent errors, you should cast the numeric type of the time to UTCTimestamp type from the package (value as UTCTimestamp) in TypeScript code.

`UTCTimestamp`
`value as UTCTimestamp`
## Example​

```text
const timestamp = 1529899200 as UTCTimestamp; // Literal timestamp representing 2018-06-25T04:00:00.000Zconst timestamp2 = (Date.now() / 1000) as UTCTimestamp;
```

- Example

---

# lightweight-charts docs api interfaces PaneRendererCustomData

Data provide to the custom series pane view which can be used within the renderer
for drawing the series data.

## Type parameters​

• HorzScaleItem

• TData extends CustomData<HorzScaleItem>

`CustomData`
`HorzScaleItem`
## Properties​

### bars​

bars: readonly CustomBarItemData<HorzScaleItem, TData>[]

`CustomBarItemData`
`HorzScaleItem`
`TData`
List of all the series' items and their x coordinates.

### barSpacing​

barSpacing: number

`number`
Spacing between consecutive bars.

### visibleRange​

visibleRange: IRange<number>

`IRange`
`number`
The current visible range of items on the chart.

- Type parametersPropertiesbarsbarSpacingvisibleRange

- barsbarSpacingvisibleRange

---

# lightweight-charts docs api type-aliases CustomSeriesPricePlotValues

CustomSeriesPricePlotValues: number[]

`number`
Price values for the custom series. This list should include the largest, smallest, and current price values for the data point.
The last value in the array will be used for the current value. You shouldn't need to
have more than 3 values in this array since the library only needs a largest, smallest, and current value.

Examples:

- For a line series, this would contain a single number representing the current value.

- For a candle series, this would contain the high, low, and close values. Where the last value would be the close value.

---

# lightweight-charts docs api interfaces ICustomSeriesPaneRenderer

Renderer for the custom series. This paints on the main chart pane.

## Methods​

### draw()​

draw(target, priceConverter, isHovered, hitTestData?): void

`target`
`priceConverter`
`isHovered`
`hitTestData`
`void`
Draw function for the renderer.

#### Parameters​

• target: CanvasRenderingTarget2D

`CanvasRenderingTarget2D`
canvas context to draw on, refer to FancyCanvas library for more details about this class.

• priceConverter: PriceToCoordinateConverter

`PriceToCoordinateConverter`
converter function for changing prices into vertical coordinate values.

• isHovered: boolean

`boolean`
Whether the series is hovered.

• hitTestData?: unknown

`unknown`
Optional hit test data for the series.

#### Returns​

void

`void`
- Methodsdraw()

- draw()

---

# lightweight-charts docs api interfaces ChartOptionsBase

Represents common chart options

## Extended by​

- ChartOptionsImpl

`ChartOptionsImpl`
## Properties​

### width​

width: number

`number`
Width of the chart in pixels

#### Default Value​

If 0 (default) or none value provided, then a size of the widget will be calculated based its container's size.

`0`
### height​

height: number

`number`
Height of the chart in pixels

#### Default Value​

If 0 (default) or none value provided, then a size of the widget will be calculated based its container's size.

`0`
### autoSize​

autoSize: boolean

`boolean`
Setting this flag to true will make the chart watch the chart container's size and automatically resize the chart to fit its container whenever the size changes.

`true`
This feature requires ResizeObserver class to be available in the global scope.
Note that calling code is responsible for providing a polyfill if required. If the global scope does not have ResizeObserver, a warning will appear and the flag will be ignored.

`ResizeObserver`
`ResizeObserver`
Please pay attention that autoSize option and explicit sizes options width and height don't conflict with one another.
If you specify autoSize flag, then width and height options will be ignored unless ResizeObserver has failed. If it fails then the values will be used as fallback.

`autoSize`
`width`
`height`
`autoSize`
`width`
`height`
`ResizeObserver`
The flag autoSize could also be set with and unset with applyOptions function.

`autoSize`
`applyOptions`
```text
const chart = LightweightCharts.createChart(document.body, {    autoSize: true,});
```

### layout​

layout: LayoutOptions

`LayoutOptions`
Layout options

### leftPriceScale​

leftPriceScale: PriceScaleOptions

`PriceScaleOptions`
Left price scale options

### rightPriceScale​

rightPriceScale: PriceScaleOptions

`PriceScaleOptions`
Right price scale options

### overlayPriceScales​

overlayPriceScales: OverlayPriceScaleOptions

`OverlayPriceScaleOptions`
Overlay price scale options

### timeScale​

timeScale: HorzScaleOptions

`HorzScaleOptions`
Time scale options

### crosshair​

crosshair: CrosshairOptions

`CrosshairOptions`
The crosshair shows the intersection of the price and time scale values at any point on the chart.

### grid​

grid: GridOptions

`GridOptions`
A grid is represented in the chart background as a vertical and horizontal lines drawn at the levels of visible marks of price and the time scales.

### handleScroll​

handleScroll: boolean | HandleScrollOptions

`boolean`
`HandleScrollOptions`
Scroll options, or a boolean flag that enables/disables scrolling

### handleScale​

handleScale: boolean | HandleScaleOptions

`boolean`
`HandleScaleOptions`
Scale options, or a boolean flag that enables/disables scaling

### kineticScroll​

kineticScroll: KineticScrollOptions

`KineticScrollOptions`
Kinetic scroll options

### trackingMode​

trackingMode: TrackingModeOptions

`TrackingModeOptions`
Represent options for the tracking mode's behavior.

Mobile users will not have the ability to see the values/dates like they do on desktop.
To see it, they should enter the tracking mode. The tracking mode will deactivate the scrolling
and make it possible to check values and dates.

### localization​

localization: LocalizationOptionsBase

`LocalizationOptionsBase`
Basic localization options

### addDefaultPane​

addDefaultPane: boolean

`boolean`
Whether to add a default pane to the chart
Disable this option when you want to create a chart with no panes and add them manually

#### Default Value​

true

`true`
- Extended byPropertieswidthheightautoSizelayoutleftPriceScalerightPriceScaleoverlayPriceScalestimeScalecrosshairgridhandleScrollhandleScalekineticScrolltrackingModelocalizationaddDefaultPane

- widthheightautoSizelayoutleftPriceScalerightPriceScaleoverlayPriceScalestimeScalecrosshairgridhandleScrollhandleScalekineticScrolltrackingModelocalizationaddDefaultPane

---

# lightweight-charts docs api interfaces CrosshairOptions

Structure describing crosshair options

## Properties​

### mode​

mode: CrosshairMode

`CrosshairMode`
Crosshair mode

#### Default Value​

```text
{@link CrosshairMode.Magnet}
```

### vertLine​

vertLine: CrosshairLineOptions

`CrosshairLineOptions`
Vertical line options.

### horzLine​

horzLine: CrosshairLineOptions

`CrosshairLineOptions`
Horizontal line options.

- PropertiesmodevertLinehorzLine

- modevertLinehorzLine

---

# lightweight-charts docs api interfaces KineticScrollOptions

Represents options for enabling or disabling kinetic scrolling with mouse and touch gestures.

## Properties​

### touch​

touch: boolean

`boolean`
Enable kinetic scroll with touch gestures.

#### Default Value​

true

`true`
### mouse​

mouse: boolean

`boolean`
Enable kinetic scroll with the mouse.

#### Default Value​

false

`false`
- Propertiestouchmouse

- touchmouse

---

# lightweight-charts docs api interfaces GridOptions

Structure describing grid options.

## Properties​

### vertLines​

vertLines: GridLineOptions

`GridLineOptions`
Vertical grid line options.

### horzLines​

horzLines: GridLineOptions

`GridLineOptions`
Horizontal grid line options.

- PropertiesvertLineshorzLines

- vertLineshorzLines

---

# lightweight-charts docs api interfaces LocalizationOptions

Represents options for formatting dates, times, and prices according to a locale.

## Extends​

- LocalizationOptionsBase

`LocalizationOptionsBase`
## Extended by​

- PriceChartLocalizationOptions

`PriceChartLocalizationOptions`
## Type parameters​

• HorzScaleItem

## Properties​

### timeFormatter?​

optional timeFormatter: TimeFormatterFn<HorzScaleItem>

`optional`
`TimeFormatterFn`
`HorzScaleItem`
Override formatting of the time scale crosshair label.

#### Default Value​

undefined

`undefined`
### dateFormat​

dateFormat: string

`string`
Date formatting string.

Can contain yyyy, yy, MMMM, MMM, MM and dd literals which will be replaced with corresponding date's value.

`yyyy`
`yy`
`MMMM`
`MMM`
`MM`
`dd`
Ignored if timeFormatter has been specified.

#### Default Value​

'dd MMM \'yy'

`'dd MMM \'yy'`
### locale​

locale: string

`string`
Current locale used to format dates. Uses the browser's language settings by default.

#### See​

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation

#### Default Value​

navigator.language

`navigator.language`
#### Inherited from​

LocalizationOptionsBase . locale

`LocalizationOptionsBase`
`locale`
### priceFormatter?​

optional priceFormatter: PriceFormatterFn

`optional`
`PriceFormatterFn`
Override formatting of the price scale tick marks, labels and crosshair labels. Can be used for cases that can't be covered with built-in price formats.

#### See​

PriceFormatCustom

#### Default Value​

undefined

`undefined`
#### Inherited from​

LocalizationOptionsBase . priceFormatter

`LocalizationOptionsBase`
`priceFormatter`
### tickmarksPriceFormatter?​

optional tickmarksPriceFormatter: TickmarksPriceFormatterFn

`optional`
`TickmarksPriceFormatterFn`
Overrides the formatting of price scale tick marks. Use this to define formatting rules based on all provided price values.

#### Default Value​

undefined

`undefined`
#### Inherited from​

LocalizationOptionsBase . tickmarksPriceFormatter

`LocalizationOptionsBase`
`tickmarksPriceFormatter`
### percentageFormatter?​

optional percentageFormatter: PercentageFormatterFn

`optional`
`PercentageFormatterFn`
Overrides the formatting of percentage scale tick marks.

#### Default Value​

undefined

`undefined`
#### Inherited from​

LocalizationOptionsBase . percentageFormatter

`LocalizationOptionsBase`
`percentageFormatter`
### tickmarksPercentageFormatter?​

optional tickmarksPercentageFormatter: TickmarksPercentageFormatterFn

`optional`
`TickmarksPercentageFormatterFn`
Override formatting of the percentage scale tick marks. Can be used if formatting should be adjusted based on all the values being formatted

#### Default Value​

undefined

`undefined`
#### Inherited from​

LocalizationOptionsBase . tickmarksPercentageFormatter

`LocalizationOptionsBase`
`tickmarksPercentageFormatter`
- ExtendsExtended byType parametersPropertiestimeFormatter?dateFormatlocalepriceFormatter?tickmarksPriceFormatter?percentageFormatter?tickmarksPercentageFormatter?

- timeFormatter?dateFormatlocalepriceFormatter?tickmarksPriceFormatter?percentageFormatter?tickmarksPercentageFormatter?

---

# lightweight-charts docs api interfaces TrackingModeOptions

Represent options for the tracking mode's behavior.

Mobile users will not have the ability to see the values/dates like they do on desktop.
To see it, they should enter the tracking mode. The tracking mode will deactivate the scrolling
and make it possible to check values and dates.

## Properties​

### exitMode​

exitMode: TrackingModeExitMode

`TrackingModeExitMode`
Determine how to exit the tracking mode.

By default, mobile users will long press to deactivate the scroll and have the ability to check values and dates.
Another press is required to activate the scroll, be able to move left/right, zoom, etc.

#### Default Value​

```text
{@link TrackingModeExitMode.OnNextTap}
```

- PropertiesexitMode

- exitMode

---

# lightweight-charts docs api interfaces PriceScaleOptions

Structure that describes price scale options

## Properties​

### autoScale​

autoScale: boolean

`boolean`
Autoscaling is a feature that automatically adjusts a price scale to fit the visible range of data.
Note that overlay price scales are always auto-scaled.

#### Default Value​

true

`true`
### mode​

mode: PriceScaleMode

`PriceScaleMode`
Price scale mode.

#### Default Value​

```text
{@link PriceScaleMode.Normal}
```

### invertScale​

invertScale: boolean

`boolean`
Invert the price scale, so that a upwards trend is shown as a downwards trend and vice versa.
Affects both the price scale and the data on the chart.

#### Default Value​

false

`false`
### alignLabels​

alignLabels: boolean

`boolean`
Align price scale labels to prevent them from overlapping.

#### Default Value​

true

`true`
### scaleMargins​

scaleMargins: PriceScaleMargins

`PriceScaleMargins`
Price scale margins.

#### Default Value​

{ bottom: 0.1, top: 0.2 }

`{ bottom: 0.1, top: 0.2 }`
#### Example​

```text
chart.priceScale('right').applyOptions({    scaleMargins: {        top: 0.8,        bottom: 0,    },});
```

### borderVisible​

borderVisible: boolean

`boolean`
Set true to draw a border between the price scale and the chart area.

#### Default Value​

true

`true`
### borderColor​

borderColor: string

`string`
Price scale border color.

#### Default Value​

'#2B2B43'

`'#2B2B43'`
### textColor?​

optional textColor: string

`optional`
`string`
Price scale text color.
If not provided LayoutOptions.textColor is used.

#### Default Value​

undefined

`undefined`
### entireTextOnly​

entireTextOnly: boolean

`boolean`
Show top and bottom corner labels only if entire text is visible.

#### Default Value​

false

`false`
### visible​

visible: boolean

`boolean`
Indicates if this price scale visible. Ignored by overlay price scales.

#### Default Value​

true for the right price scale and false for the left.
For the yield curve chart, the default is for the left scale to be visible.

`true`
`false`
### ticksVisible​

ticksVisible: boolean

`boolean`
Draw small horizontal line on price axis labels.

#### Default Value​

false

`false`
### minimumWidth​

minimumWidth: number

`number`
Define a minimum width for the price scale.
Note: This value will be exceeded if the
price scale needs more space to display it's contents.

Setting a minimum width could be useful for ensuring that
multiple charts positioned in a vertical stack each have
an identical price scale width, or for plugins which
require a bit more space within the price scale pane.

#### Default Value​

```text
0
```

### ensureEdgeTickMarksVisible​

ensureEdgeTickMarksVisible: boolean

`boolean`
Ensures that tick marks are always visible at the very top and bottom of the price scale,
regardless of the data range. When enabled, a tick mark will be drawn at both edges of the scale,
providing clear boundary indicators.

#### Default Value​

```text
false
```

- PropertiesautoScalemodeinvertScalealignLabelsscaleMarginsborderVisibleborderColortextColor?entireTextOnlyvisibleticksVisibleminimumWidthensureEdgeTickMarksVisible

- autoScalemodeinvertScalealignLabelsscaleMarginsborderVisibleborderColortextColor?entireTextOnlyvisibleticksVisibleminimumWidthensureEdgeTickMarksVisible

---

# lightweight-charts docs api interfaces HandleScrollOptions

Represents options for how the chart is scrolled by the mouse and touch gestures.

## Properties​

### mouseWheel​

mouseWheel: boolean

`boolean`
Enable scrolling with the mouse wheel.

#### Default Value​

true

`true`
### pressedMouseMove​

pressedMouseMove: boolean

`boolean`
Enable scrolling by holding down the left mouse button and moving the mouse.

#### Default Value​

true

`true`
### horzTouchDrag​

horzTouchDrag: boolean

`boolean`
Enable horizontal touch scrolling.

When enabled the chart handles touch gestures that would normally scroll the webpage horizontally.

#### Default Value​

true

`true`
### vertTouchDrag​

vertTouchDrag: boolean

`boolean`
Enable vertical touch scrolling.

When enabled the chart handles touch gestures that would normally scroll the webpage vertically.

#### Default Value​

true

`true`
- PropertiesmouseWheelpressedMouseMovehorzTouchDragvertTouchDrag

- mouseWheelpressedMouseMovehorzTouchDragvertTouchDrag

---

# lightweight-charts docs api interfaces PriceChartOptions

Configuration options specific to price-based charts.
Extends the base chart options and includes localization settings for price formatting.

## Extends​

- ChartOptionsImpl<number>

`ChartOptionsImpl`
`number`
## Properties​

### width​

width: number

`number`
Width of the chart in pixels

#### Default Value​

If 0 (default) or none value provided, then a size of the widget will be calculated based its container's size.

`0`
#### Inherited from​

ChartOptionsImpl . width

`ChartOptionsImpl`
`width`
### height​

height: number

`number`
Height of the chart in pixels

#### Default Value​

If 0 (default) or none value provided, then a size of the widget will be calculated based its container's size.

`0`
#### Inherited from​

ChartOptionsImpl . height

`ChartOptionsImpl`
`height`
### autoSize​

autoSize: boolean

`boolean`
Setting this flag to true will make the chart watch the chart container's size and automatically resize the chart to fit its container whenever the size changes.

`true`
This feature requires ResizeObserver class to be available in the global scope.
Note that calling code is responsible for providing a polyfill if required. If the global scope does not have ResizeObserver, a warning will appear and the flag will be ignored.

`ResizeObserver`
`ResizeObserver`
Please pay attention that autoSize option and explicit sizes options width and height don't conflict with one another.
If you specify autoSize flag, then width and height options will be ignored unless ResizeObserver has failed. If it fails then the values will be used as fallback.

`autoSize`
`width`
`height`
`autoSize`
`width`
`height`
`ResizeObserver`
The flag autoSize could also be set with and unset with applyOptions function.

`autoSize`
`applyOptions`
```text
const chart = LightweightCharts.createChart(document.body, {    autoSize: true,});
```

#### Inherited from​

ChartOptionsImpl . autoSize

`ChartOptionsImpl`
`autoSize`
### layout​

layout: LayoutOptions

`LayoutOptions`
Layout options

#### Inherited from​

ChartOptionsImpl . layout

`ChartOptionsImpl`
`layout`
### leftPriceScale​

leftPriceScale: PriceScaleOptions

`PriceScaleOptions`
Left price scale options

#### Inherited from​

ChartOptionsImpl . leftPriceScale

`ChartOptionsImpl`
`leftPriceScale`
### rightPriceScale​

rightPriceScale: PriceScaleOptions

`PriceScaleOptions`
Right price scale options

#### Inherited from​

ChartOptionsImpl . rightPriceScale

`ChartOptionsImpl`
`rightPriceScale`
### overlayPriceScales​

overlayPriceScales: OverlayPriceScaleOptions

`OverlayPriceScaleOptions`
Overlay price scale options

#### Inherited from​

ChartOptionsImpl . overlayPriceScales

`ChartOptionsImpl`
`overlayPriceScales`
### timeScale​

timeScale: HorzScaleOptions

`HorzScaleOptions`
Time scale options

#### Inherited from​

ChartOptionsImpl . timeScale

`ChartOptionsImpl`
`timeScale`
### crosshair​

crosshair: CrosshairOptions

`CrosshairOptions`
The crosshair shows the intersection of the price and time scale values at any point on the chart.

#### Inherited from​

ChartOptionsImpl . crosshair

`ChartOptionsImpl`
`crosshair`
### grid​

grid: GridOptions

`GridOptions`
A grid is represented in the chart background as a vertical and horizontal lines drawn at the levels of visible marks of price and the time scales.

#### Inherited from​

ChartOptionsImpl . grid

`ChartOptionsImpl`
`grid`
### handleScroll​

handleScroll: boolean | HandleScrollOptions

`boolean`
`HandleScrollOptions`
Scroll options, or a boolean flag that enables/disables scrolling

#### Inherited from​

ChartOptionsImpl . handleScroll

`ChartOptionsImpl`
`handleScroll`
### handleScale​

handleScale: boolean | HandleScaleOptions

`boolean`
`HandleScaleOptions`
Scale options, or a boolean flag that enables/disables scaling

#### Inherited from​

ChartOptionsImpl . handleScale

`ChartOptionsImpl`
`handleScale`
### kineticScroll​

kineticScroll: KineticScrollOptions

`KineticScrollOptions`
Kinetic scroll options

#### Inherited from​

ChartOptionsImpl . kineticScroll

`ChartOptionsImpl`
`kineticScroll`
### trackingMode​

trackingMode: TrackingModeOptions

`TrackingModeOptions`
Represent options for the tracking mode's behavior.

Mobile users will not have the ability to see the values/dates like they do on desktop.
To see it, they should enter the tracking mode. The tracking mode will deactivate the scrolling
and make it possible to check values and dates.

#### Inherited from​

ChartOptionsImpl . trackingMode

`ChartOptionsImpl`
`trackingMode`
### addDefaultPane​

addDefaultPane: boolean

`boolean`
Whether to add a default pane to the chart
Disable this option when you want to create a chart with no panes and add them manually

#### Default Value​

true

`true`
#### Inherited from​

ChartOptionsImpl . addDefaultPane

`ChartOptionsImpl`
`addDefaultPane`
### localization​

localization: PriceChartLocalizationOptions

`PriceChartLocalizationOptions`
Localization options for formatting price values and other chart elements.

#### Overrides​

ChartOptionsImpl . localization

`ChartOptionsImpl`
`localization`
- ExtendsPropertieswidthheightautoSizelayoutleftPriceScalerightPriceScaleoverlayPriceScalestimeScalecrosshairgridhandleScrollhandleScalekineticScrolltrackingModeaddDefaultPanelocalization

- widthheightautoSizelayoutleftPriceScalerightPriceScaleoverlayPriceScalestimeScalecrosshairgridhandleScrollhandleScalekineticScrolltrackingModeaddDefaultPanelocalization

---

# lightweight-charts docs api interfaces YieldCurveChartOptions

Extended chart options that include yield curve specific options.
This interface combines the standard chart options with yield curve options.

## Extends​

- ChartOptionsImpl<number>

`ChartOptionsImpl`
`number`
## Properties​

### width​

width: number

`number`
Width of the chart in pixels

#### Default Value​

If 0 (default) or none value provided, then a size of the widget will be calculated based its container's size.

`0`
#### Inherited from​

ChartOptionsImpl . width

`ChartOptionsImpl`
`width`
### height​

height: number

`number`
Height of the chart in pixels

#### Default Value​

If 0 (default) or none value provided, then a size of the widget will be calculated based its container's size.

`0`
#### Inherited from​

ChartOptionsImpl . height

`ChartOptionsImpl`
`height`
### autoSize​

autoSize: boolean

`boolean`
Setting this flag to true will make the chart watch the chart container's size and automatically resize the chart to fit its container whenever the size changes.

`true`
This feature requires ResizeObserver class to be available in the global scope.
Note that calling code is responsible for providing a polyfill if required. If the global scope does not have ResizeObserver, a warning will appear and the flag will be ignored.

`ResizeObserver`
`ResizeObserver`
Please pay attention that autoSize option and explicit sizes options width and height don't conflict with one another.
If you specify autoSize flag, then width and height options will be ignored unless ResizeObserver has failed. If it fails then the values will be used as fallback.

`autoSize`
`width`
`height`
`autoSize`
`width`
`height`
`ResizeObserver`
The flag autoSize could also be set with and unset with applyOptions function.

`autoSize`
`applyOptions`
```text
const chart = LightweightCharts.createChart(document.body, {    autoSize: true,});
```

#### Inherited from​

ChartOptionsImpl . autoSize

`ChartOptionsImpl`
`autoSize`
### layout​

layout: LayoutOptions

`LayoutOptions`
Layout options

#### Inherited from​

ChartOptionsImpl . layout

`ChartOptionsImpl`
`layout`
### leftPriceScale​

leftPriceScale: PriceScaleOptions

`PriceScaleOptions`
Left price scale options

#### Inherited from​

ChartOptionsImpl . leftPriceScale

`ChartOptionsImpl`
`leftPriceScale`
### rightPriceScale​

rightPriceScale: PriceScaleOptions

`PriceScaleOptions`
Right price scale options

#### Inherited from​

ChartOptionsImpl . rightPriceScale

`ChartOptionsImpl`
`rightPriceScale`
### overlayPriceScales​

overlayPriceScales: OverlayPriceScaleOptions

`OverlayPriceScaleOptions`
Overlay price scale options

#### Inherited from​

ChartOptionsImpl . overlayPriceScales

`ChartOptionsImpl`
`overlayPriceScales`
### timeScale​

timeScale: HorzScaleOptions

`HorzScaleOptions`
Time scale options

#### Inherited from​

ChartOptionsImpl . timeScale

`ChartOptionsImpl`
`timeScale`
### crosshair​

crosshair: CrosshairOptions

`CrosshairOptions`
The crosshair shows the intersection of the price and time scale values at any point on the chart.

#### Inherited from​

ChartOptionsImpl . crosshair

`ChartOptionsImpl`
`crosshair`
### grid​

grid: GridOptions

`GridOptions`
A grid is represented in the chart background as a vertical and horizontal lines drawn at the levels of visible marks of price and the time scales.

#### Inherited from​

ChartOptionsImpl . grid

`ChartOptionsImpl`
`grid`
### handleScroll​

handleScroll: boolean | HandleScrollOptions

`boolean`
`HandleScrollOptions`
Scroll options, or a boolean flag that enables/disables scrolling

#### Inherited from​

ChartOptionsImpl . handleScroll

`ChartOptionsImpl`
`handleScroll`
### handleScale​

handleScale: boolean | HandleScaleOptions

`boolean`
`HandleScaleOptions`
Scale options, or a boolean flag that enables/disables scaling

#### Inherited from​

ChartOptionsImpl . handleScale

`ChartOptionsImpl`
`handleScale`
### kineticScroll​

kineticScroll: KineticScrollOptions

`KineticScrollOptions`
Kinetic scroll options

#### Inherited from​

ChartOptionsImpl . kineticScroll

`ChartOptionsImpl`
`kineticScroll`
### trackingMode​

trackingMode: TrackingModeOptions

`TrackingModeOptions`
Represent options for the tracking mode's behavior.

Mobile users will not have the ability to see the values/dates like they do on desktop.
To see it, they should enter the tracking mode. The tracking mode will deactivate the scrolling
and make it possible to check values and dates.

#### Inherited from​

ChartOptionsImpl . trackingMode

`ChartOptionsImpl`
`trackingMode`
### addDefaultPane​

addDefaultPane: boolean

`boolean`
Whether to add a default pane to the chart
Disable this option when you want to create a chart with no panes and add them manually

#### Default Value​

true

`true`
#### Inherited from​

ChartOptionsImpl . addDefaultPane

`ChartOptionsImpl`
`addDefaultPane`
### localization​

localization: LocalizationOptions<number>

`LocalizationOptions`
`number`
Localization options.

#### Inherited from​

ChartOptionsImpl . localization

`ChartOptionsImpl`
`localization`
### yieldCurve​

yieldCurve: YieldCurveOptions

`YieldCurveOptions`
Yield curve specific options.
This object contains all the settings related to how the yield curve is displayed and behaves.

- ExtendsPropertieswidthheightautoSizelayoutleftPriceScalerightPriceScaleoverlayPriceScalestimeScalecrosshairgridhandleScrollhandleScalekineticScrolltrackingModeaddDefaultPanelocalizationyieldCurve

- widthheightautoSizelayoutleftPriceScalerightPriceScaleoverlayPriceScalestimeScalecrosshairgridhandleScrollhandleScalekineticScrolltrackingModeaddDefaultPanelocalizationyieldCurve

---

# lightweight-charts docs api interfaces HandleScaleOptions

Represents options for how the chart is scaled by the mouse and touch gestures.

## Properties​

### mouseWheel​

mouseWheel: boolean

`boolean`
Enable scaling with the mouse wheel.

#### Default Value​

true

`true`
### pinch​

pinch: boolean

`boolean`
Enable scaling with pinch/zoom gestures.

#### Default Value​

true

`true`
### axisPressedMouseMove​

axisPressedMouseMove: boolean | AxisPressedMouseMoveOptions

`boolean`
`AxisPressedMouseMoveOptions`
Enable scaling the price and/or time scales by holding down the left mouse button and moving the mouse.

### axisDoubleClickReset​

axisDoubleClickReset: boolean | AxisDoubleClickOptions

`boolean`
`AxisDoubleClickOptions`
Enable resetting scaling by double-clicking the left mouse button.

- PropertiesmouseWheelpinchaxisPressedMouseMoveaxisDoubleClickReset

- mouseWheelpinchaxisPressedMouseMoveaxisDoubleClickReset

---

# lightweight-charts docs api interfaces LayoutOptions

Represents layout options

## Properties​

### background​

background: Background

`Background`
Chart and scales background color.

#### Default Value​

{ type: ColorType.Solid, color: '#FFFFFF' }

`{ type: ColorType.Solid, color: '#FFFFFF' }`
### textColor​

textColor: string

`string`
Color of text on the scales.

#### Default Value​

'#191919'

`'#191919'`
### fontSize​

fontSize: number

`number`
Font size of text on scales in pixels.

#### Default Value​

12

`12`
### fontFamily​

fontFamily: string

`string`
Font family of text on the scales.

#### Default Value​

-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif

`-apple-system, BlinkMacSystemFont, 'Trebuchet MS', Roboto, Ubuntu, sans-serif`
### panes​

panes: LayoutPanesOptions

`LayoutPanesOptions`
Panes options.

#### Default Value​

{ enableResize: true, separatorColor: '#2B2B43', separatorHoverColor: 'rgba(178, 181, 189, 0.2)'}

`{ enableResize: true, separatorColor: '#2B2B43', separatorHoverColor: 'rgba(178, 181, 189, 0.2)'}`
### attributionLogo​

attributionLogo: boolean

`boolean`
Display the TradingView attribution logo on the main chart pane.

The licence for library specifies that you add the "attribution notice"
from the NOTICE file to your code and a link to https://www.tradingview.com/ to
the page of your website or mobile application that is available to your users.
Using this attribution logo is sufficient for meeting this linking requirement.
However, if you already fulfill this requirement then you can disable this
attribution logo.

#### Default Value​

```text
true
```

### colorSpace​

colorSpace: ColorSpace

`ColorSpace`
Specifies the color space of the rendering context for the internal
canvas elements.

Note: this option should only be specified during the chart creation
and not changed at a later stage by using applyOptions.

`applyOptions`
#### Default Value​

srgb

`srgb`
See HTMLCanvasElement: getContext() method - Web APIs | MDN for more info

### colorParsers​

colorParsers: CustomColorParser[]

`CustomColorParser`
Array of custom color parser functions to handle color formats outside of standard sRGB values.
Each parser function takes a string input and should return either:

- An Rgba array [r,g,b,a] for valid colors (with values 0-255 for rgb and 0-1 for a)

- null if the parser cannot handle that color string, allowing the next parser to attempt it

Parsers are tried in order until one returns a non-null result. This allows chaining multiple
parsers to handle different color space formats.

Note: this option should only be specified during the chart creation
and not changed at a later stage by using applyOptions.

`applyOptions`
The library already supports these color formats by default:

- Hex colors (#RGB, #RGBA, #RRGGBB, #RRGGBBAA)

- RGB/RGBA functions (rgb(), rgba())

- HSL/HSLA functions (hsl(), hsla())

- HWB function (hwb())

- Named colors (red, blue, etc.)

- 'transparent' keyword

Custom parsers are only needed for other color spaces like:

- Display P3: color(display-p3 r g b)

- CIE Lab: lab(l a b)

- LCH: lch(l c h)

- Oklab: oklab(l a b)

- Oklch: oklch(l c h)

- ...

- PropertiesbackgroundtextColorfontSizefontFamilypanesattributionLogocolorSpacecolorParsers

- backgroundtextColorfontSizefontFamilypanesattributionLogocolorSpacecolorParsers

---

# lightweight-charts docs api type-aliases OverlayPriceScaleOptions

OverlayPriceScaleOptions: Omit <PriceScaleOptions, "visible" | "autoScale">

`Omit`
`PriceScaleOptions`
`"visible"`
`"autoScale"`
Represents overlay price scale options.

---

# lightweight-charts docs api interfaces TimeMark

Represents a tick mark on the horizontal (time) scale.

## Properties​

### needAlignCoordinate​

needAlignCoordinate: boolean

`boolean`
Does time mark need to be aligned

### coord​

coord: number

`number`
Coordinate for the time mark

### label​

label: string

`string`
Display label for the time mark

### weight​

weight: TickMarkWeightValue

`TickMarkWeightValue`
Weight of the time mark

- PropertiesneedAlignCoordinatecoordlabelweight

- needAlignCoordinatecoordlabelweight

---

# lightweight-charts docs api type-aliases HorzScaleItemConverterToInternalObj

HorzScaleItemConverterToInternalObj<HorzScaleItem>: (time) => InternalHorzScaleItem

`HorzScaleItem`
`time`
`InternalHorzScaleItem`
Function for converting a horizontal scale item to an internal item.

## Type parameters​

• HorzScaleItem

## Parameters​

• time: HorzScaleItem

`HorzScaleItem`
## Returns​

InternalHorzScaleItem

`InternalHorzScaleItem`
- Type parametersParametersReturns

---

# lightweight-charts docs api type-aliases InternalHorzScaleItemKey

InternalHorzScaleItemKey: Nominal<number, "InternalHorzScaleItemKey">

`Nominal`
`number`
`"InternalHorzScaleItemKey"`
Index key for a horizontal scale item.

---

# lightweight-charts docs api interfaces TickMark

Tick mark for the horizontal scale.

## Properties​

### index​

index: TimePointIndex

`TimePointIndex`
Index

### time​

time: object

`object`
Time / Coordinate

#### [species]​

[species]: "InternalHorzScaleItem"

`"InternalHorzScaleItem"`
The 'name' or species of the nominal.

### weight​

weight: TickMarkWeightValue

`TickMarkWeightValue`
Weight of the tick mark

### originalTime​

originalTime: unknown

`unknown`
Original value for the time property

`time`
- PropertiesindextimeweightoriginalTime

- indextimeweightoriginalTime

---

# lightweight-charts docs api interfaces TimeScalePoint

Represents a point on the time scale

## Properties​

### timeWeight​

readonly timeWeight: TickMarkWeightValue

`readonly`
`TickMarkWeightValue`
Weight of the point

### time​

readonly time: object

`readonly`
`object`
Time of the point

#### [species]​

[species]: "InternalHorzScaleItem"

`"InternalHorzScaleItem"`
The 'name' or species of the nominal.

### originalTime​

readonly originalTime: unknown

`readonly`
`unknown`
Original time for the point

- PropertiestimeWeighttimeoriginalTime

- timeWeighttimeoriginalTime

---

# lightweight-charts docs api type-aliases DataItem

DataItem<HorzScaleItem>: SeriesDataItemTypeMap<HorzScaleItem>[SeriesType]

`HorzScaleItem`
`SeriesDataItemTypeMap`
`HorzScaleItem`
`SeriesType`
Represents the type of data that a series contains.

## Type parameters​

• HorzScaleItem

- Type parameters

---

# lightweight-charts docs api type-aliases Mutable

Mutable<T>: { -readonly [P in keyof T]: T[P] }

`T`
`{ -readonly [P in keyof T]: T[P] }`
Removes "readonly" from all properties

## Type parameters​

• T

- Type parameters

---

# lightweight-charts docs api type-aliases TickMarkWeightValue

TickMarkWeightValue: Nominal<number, "TickMarkWeightValue">

`Nominal`
`number`
`"TickMarkWeightValue"`
Weight of the tick mark.

## See​

TickMarkWeight enum

- See

---

# lightweight-charts docs api type-aliases PriceFormat

PriceFormat: PriceFormatBuiltIn | PriceFormatCustom

`PriceFormatBuiltIn`
`PriceFormatCustom`
Represents information used to format prices.

---

# lightweight-charts docs api enumerations PriceLineSource

Represents the source of data to be used for the horizontal price line.

## Enumeration Members​

### LastBar​

LastBar: 0

`0`
Use the last bar data.

### LastVisible​

LastVisible: 1

`1`
Use the last visible data of the chart viewport.

- Enumeration MembersLastBarLastVisible

- LastBarLastVisible

---

# lightweight-charts docs api interfaces AutoscaleInfo

Represents information used to update a price scale.

## Properties​

### priceRange​

priceRange: PriceRange

`PriceRange`
Price range.

### margins?​

optional margins: AutoScaleMargins

`optional`
`AutoScaleMargins`
Scale margins.

- PropertiespriceRangemargins?

- priceRangemargins?

---

# lightweight-charts docs api type-aliases AutoscaleInfoProvider

AutoscaleInfoProvider: (baseImplementation) => AutoscaleInfo | null

`baseImplementation`
`AutoscaleInfo`
`null`
A custom function used to get autoscale information.

## Parameters​

• baseImplementation

The default implementation of autoscale algorithm, you can use it to adjust the result.

## Returns​

AutoscaleInfo | null

`AutoscaleInfo`
`null`
- ParametersReturns

---

# lightweight-charts docs api interfaces TimeScaleOptions

Extended time scale options for time-based horizontal scale

## Extends​

- HorzScaleOptions

`HorzScaleOptions`
## Properties​

### rightOffset​

rightOffset: number

`number`
The margin space in bars from the right side of the chart.

#### Default Value​

0

`0`
#### Inherited from​

HorzScaleOptions . rightOffset

`HorzScaleOptions`
`rightOffset`
### rightOffsetPixels?​

optional rightOffsetPixels: number

`optional`
`number`
The margin space in pixels from the right side of the chart.
This option has priority over rightOffset.

`rightOffset`
#### Default Value​

undefined

`undefined`
#### Inherited from​

HorzScaleOptions . rightOffsetPixels

`HorzScaleOptions`
`rightOffsetPixels`
### barSpacing​

barSpacing: number

`number`
The space between bars in pixels.

#### Default Value​

6

`6`
#### Inherited from​

HorzScaleOptions . barSpacing

`HorzScaleOptions`
`barSpacing`
### minBarSpacing​

minBarSpacing: number

`number`
The minimum space between bars in pixels.

#### Default Value​

0.5

`0.5`
#### Inherited from​

HorzScaleOptions . minBarSpacing

`HorzScaleOptions`
`minBarSpacing`
### maxBarSpacing​

maxBarSpacing: number

`number`
The maximum space between bars in pixels.

Has no effect if value is set to 0.

`0`
#### Default Value​

0

`0`
#### Inherited from​

HorzScaleOptions . maxBarSpacing

`HorzScaleOptions`
`maxBarSpacing`
### fixLeftEdge​

fixLeftEdge: boolean

`boolean`
Prevent scrolling to the left of the first bar.

#### Default Value​

false

`false`
#### Inherited from​

HorzScaleOptions . fixLeftEdge

`HorzScaleOptions`
`fixLeftEdge`
### fixRightEdge​

fixRightEdge: boolean

`boolean`
Prevent scrolling to the right of the most recent bar.

#### Default Value​

false

`false`
#### Inherited from​

HorzScaleOptions . fixRightEdge

`HorzScaleOptions`
`fixRightEdge`
### lockVisibleTimeRangeOnResize​

lockVisibleTimeRangeOnResize: boolean

`boolean`
Prevent changing the visible time range during chart resizing.

#### Default Value​

false

`false`
#### Inherited from​

HorzScaleOptions . lockVisibleTimeRangeOnResize

`HorzScaleOptions`
`lockVisibleTimeRangeOnResize`
### rightBarStaysOnScroll​

rightBarStaysOnScroll: boolean

`boolean`
Prevent the hovered bar from moving when scrolling.

#### Default Value​

false

`false`
#### Inherited from​

HorzScaleOptions . rightBarStaysOnScroll

`HorzScaleOptions`
`rightBarStaysOnScroll`
### borderVisible​

borderVisible: boolean

`boolean`
Show the time scale border.

#### Default Value​

true

`true`
#### Inherited from​

HorzScaleOptions . borderVisible

`HorzScaleOptions`
`borderVisible`
### borderColor​

borderColor: string

`string`
The time scale border color.

#### Default Value​

'#2B2B43'

`'#2B2B43'`
#### Inherited from​

HorzScaleOptions . borderColor

`HorzScaleOptions`
`borderColor`
### visible​

visible: boolean

`boolean`
Show the time scale.

#### Default Value​

true

`true`
#### Inherited from​

HorzScaleOptions . visible

`HorzScaleOptions`
`visible`
### timeVisible​

timeVisible: boolean

`boolean`
Show the time, not just the date, in the time scale and vertical crosshair label.

#### Default Value​

false

`false`
#### Inherited from​

HorzScaleOptions . timeVisible

`HorzScaleOptions`
`timeVisible`
### secondsVisible​

secondsVisible: boolean

`boolean`
Show seconds in the time scale and vertical crosshair label in hh:mm:ss format for intraday data.

`hh:mm:ss`
#### Default Value​

true

`true`
#### Inherited from​

HorzScaleOptions . secondsVisible

`HorzScaleOptions`
`secondsVisible`
### shiftVisibleRangeOnNewBar​

shiftVisibleRangeOnNewBar: boolean

`boolean`
Shift the visible range to the right (into the future) by the number of new bars when new data is added.

Note that this only applies when the last bar is visible.

#### Default Value​

true

`true`
#### Inherited from​

HorzScaleOptions . shiftVisibleRangeOnNewBar

`HorzScaleOptions`
`shiftVisibleRangeOnNewBar`
### allowShiftVisibleRangeOnWhitespaceReplacement​

allowShiftVisibleRangeOnWhitespaceReplacement: boolean

`boolean`
Allow the visible range to be shifted to the right when a new bar is added which
is replacing an existing whitespace time point on the chart.

Note that this only applies when the last bar is visible & shiftVisibleRangeOnNewBar is enabled.

`shiftVisibleRangeOnNewBar`
#### Default Value​

false

`false`
#### Inherited from​

HorzScaleOptions . allowShiftVisibleRangeOnWhitespaceReplacement

`HorzScaleOptions`
`allowShiftVisibleRangeOnWhitespaceReplacement`
### ticksVisible​

ticksVisible: boolean

`boolean`
Draw small vertical line on time axis labels.

#### Default Value​

false

`false`
#### Inherited from​

HorzScaleOptions . ticksVisible

`HorzScaleOptions`
`ticksVisible`
### tickMarkMaxCharacterLength?​

optional tickMarkMaxCharacterLength: number

`optional`
`number`
Maximum tick mark label length. Used to override the default 8 character maximum length.

#### Default Value​

undefined

`undefined`
#### Inherited from​

HorzScaleOptions . tickMarkMaxCharacterLength

`HorzScaleOptions`
`tickMarkMaxCharacterLength`
### uniformDistribution​

uniformDistribution: boolean

`boolean`
Changes horizontal scale marks generation.
With this flag equal to true, marks of the same weight are either all drawn or none are drawn at all.

`true`
#### Inherited from​

HorzScaleOptions . uniformDistribution

`HorzScaleOptions`
`uniformDistribution`
### minimumHeight​

minimumHeight: number

`number`
Define a minimum height for the time scale.
Note: This value will be exceeded if the
time scale needs more space to display it's contents.

Setting a minimum height could be useful for ensuring that
multiple charts positioned in a horizontal stack each have
an identical time scale height, or for plugins which
require a bit more space within the time scale pane.

#### Default Value​

```text
0
```

#### Inherited from​

HorzScaleOptions . minimumHeight

`HorzScaleOptions`
`minimumHeight`
### allowBoldLabels​

allowBoldLabels: boolean

`boolean`
Allow major time scale labels to be rendered in a bolder font weight.

#### Default Value​

```text
true
```

#### Inherited from​

HorzScaleOptions . allowBoldLabels

`HorzScaleOptions`
`allowBoldLabels`
### ignoreWhitespaceIndices​

ignoreWhitespaceIndices: boolean

`boolean`
Ignore time scale points containing only whitespace (for all series) when
drawing grid lines, tick marks, and snapping the crosshair to time scale points.

For the yield curve chart type it defaults to true.

`true`
#### Default Value​

```text
false
```

#### Inherited from​

HorzScaleOptions . ignoreWhitespaceIndices

`HorzScaleOptions`
`ignoreWhitespaceIndices`
### tickMarkFormatter?​

optional tickMarkFormatter: TickMarkFormatter

`optional`
`TickMarkFormatter`
Tick marks formatter can be used to customize tick marks labels on the time axis.

#### Default Value​

undefined

`undefined`
- ExtendsPropertiesrightOffsetrightOffsetPixels?barSpacingminBarSpacingmaxBarSpacingfixLeftEdgefixRightEdgelockVisibleTimeRangeOnResizerightBarStaysOnScrollborderVisibleborderColorvisibletimeVisiblesecondsVisibleshiftVisibleRangeOnNewBarallowShiftVisibleRangeOnWhitespaceReplacementticksVisibletickMarkMaxCharacterLength?uniformDistributionminimumHeightallowBoldLabelsignoreWhitespaceIndicestickMarkFormatter?

- rightOffsetrightOffsetPixels?barSpacingminBarSpacingmaxBarSpacingfixLeftEdgefixRightEdgelockVisibleTimeRangeOnResizerightBarStaysOnScrollborderVisibleborderColorvisibletimeVisiblesecondsVisibleshiftVisibleRangeOnNewBarallowShiftVisibleRangeOnWhitespaceReplacementticksVisibletickMarkMaxCharacterLength?uniformDistributionminimumHeightallowBoldLabelsignoreWhitespaceIndicestickMarkFormatter?

---

# lightweight-charts docs api type-aliases Nominal

Nominal<T, Name>: T & object

`T`
`Name`
`T`
`object`
This is the generic type useful for declaring a nominal type,
which does not structurally matches with the base type and
the other types declared over the same base type

## Examples​

```text
type Index = Nominal<number, 'Index'>;// let i: Index = 42; // this fails to compilelet i: Index = 42 as Index; // OK
```

```text
type TagName = Nominal<string, 'TagName'>;
```

## Type declaration​

### [species]​

[species]: Name

`Name`
The 'name' or species of the nominal.

## Type parameters​

• T

• Name extends string

`string`
- ExamplesType declaration[species]Type parameters

- [species]

---

# lightweight-charts docs api interfaces PriceLineOptions

Represents a price line options.

## Properties​

### id?​

optional id: string

`optional`
`string`
The optional ID of this price line.

### price​

price: number

`number`
Price line's value.

#### Default Value​

0

`0`
### color​

color: string

`string`
Price line's color.

#### Default Value​

''

`''`
### lineWidth​

lineWidth: LineWidth

`LineWidth`
Price line's width in pixels.

#### Default Value​

1

`1`
### lineStyle​

lineStyle: LineStyle

`LineStyle`
Price line's style.

#### Default Value​

```text
{@link LineStyle.Solid}
```

### lineVisible​

lineVisible: boolean

`boolean`
Display line.

#### Default Value​

true

`true`
### axisLabelVisible​

axisLabelVisible: boolean

`boolean`
Display the current price value in on the price scale.

#### Default Value​

true

`true`
### title​

title: string

`string`
Price line's on the chart pane.

#### Default Value​

''

`''`
### axisLabelColor​

axisLabelColor: string

`string`
Background color for the axis label.
Will default to the price line color if unspecified.

#### Default Value​

''

`''`
### axisLabelTextColor​

axisLabelTextColor: string

`string`
Text color for the axis label.

#### Default Value​

''

`''`
- Propertiesid?pricecolorlineWidthlineStylelineVisibleaxisLabelVisibletitleaxisLabelColoraxisLabelTextColor

- id?pricecolorlineWidthlineStylelineVisibleaxisLabelVisibletitleaxisLabelColoraxisLabelTextColor

---

# lightweight-charts docs api type-aliases DataChangedScope

DataChangedScope: "full" | "update"

`"full"`
`"update"`
The extent of the data change.

---

# lightweight-charts docs api interfaces LastValueDataResultWithData

Represents last value data result of a series for plugins when there is data

## Properties​

### noData​

noData: false

`false`
Indicates if the series has data.

### price​

price: number

`number`
The last price of the series.

### color​

color: string

`string`
The color of the last value.

- PropertiesnoDatapricecolor

- noDatapricecolor

---

# lightweight-charts docs api interfaces LastValueDataResultWithoutData

Represents last value data result of a series for plugins when there is no data

## Properties​

### noData​

noData: true

`true`
Indicates if the series has data.

- PropertiesnoData

- noData

---

# lightweight-charts docs chart-types

Lightweight Charts offers different types of charts to suit various data visualization needs. This article provides an overview of the available chart types and how to create them.

## Standard Time-based Chart​

The standard time-based chart is the most common type, suitable for displaying time series data.

- Creation method: createChart

- Horizontal scale: Time-based

- Use case: General-purpose charting for financial and time series data

`createChart`
```text
import { createChart } from 'lightweight-charts';const chart = createChart(document.getElementById('container'), options);
```

This chart type uses time values for the horizontal scale and is ideal for most financial and time series data visualizations.

```text
const chartOptions = { layout: { textColor: 'black', background: { type: 'solid', color: 'white' } } };const chart = createChart(document.getElementById('container'), chartOptions);const areaSeries = chart.addSeries(AreaSeries, { lineColor: '#2962FF', topColor: '#2962FF', bottomColor: 'rgba(41, 98, 255, 0.28)' });const data = [{ value: 0, time: 1642425322 }, { value: 8, time: 1642511722 }, { value: 10, time: 1642598122 }, { value: 20, time: 1642684522 }, { value: 3, time: 1642770922 }, { value: 43, time: 1642857322 }, { value: 41, time: 1642943722 }, { value: 43, time: 1643030122 }, { value: 56, time: 1643116522 }, { value: 46, time: 1643202922 }];areaSeries.setData(data);chart.timeScale().fitContent();
```

## Yield Curve Chart​

The yield curve chart is specifically designed for displaying yield curves, common in financial analysis.

- Creation method: createYieldCurveChart

- Horizontal scale: Linearly spaced, defined in monthly time duration units

- Key differences:

Whitespace is ignored for crosshair and grid lines
Specialized for yield curve representation

`createYieldCurveChart`
- Whitespace is ignored for crosshair and grid lines

- Specialized for yield curve representation

```text
import { createYieldCurveChart } from 'lightweight-charts';const chart = createYieldCurveChart(document.getElementById('container'), options);
```

Use this chart type when you need to visualize yield curves or similar financial data where the horizontal scale represents time durations rather than specific dates.

If you want to spread out the beginning of the plot further and don't need a linear time scale, you can enforce a minimum spacing around each point by increasing the minBarSpacing option in the TimeScaleOptions. To prevent the rest of the chart from spreading too wide, adjust the baseResolution to a larger number, such as 12 (months).

`minBarSpacing`
`baseResolution`
`12`
```text
const chartOptions = {    layout: { textColor: 'black', background: { type: 'solid', color: 'white' } },    yieldCurve: { baseResolution: 1, minimumTimeRange: 10, startTimeRange: 3 },    handleScroll: false, handleScale: false,};const chart = createYieldCurveChart(document.getElementById('container'), chartOptions);const lineSeries = chart.addSeries(LineSeries, { color: '#2962FF' });const curve = [{ time: 1, value: 5.378 }, { time: 2, value: 5.372 }, { time: 3, value: 5.271 }, { time: 6, value: 5.094 }, { time: 12, value: 4.739 }, { time: 24, value: 4.237 }, { time: 36, value: 4.036 }, { time: 60, value: 3.887 }, { time: 84, value: 3.921 }, { time: 120, value: 4.007 }, { time: 240, value: 4.366 }, { time: 360, value: 4.290 }];lineSeries.setData(curve);chart.timeScale().fitContent();
```

## Options Chart (Price-based)​

The options chart is a specialized type that uses price values on the horizontal scale instead of time.

- Creation method: createOptionsChart

- Horizontal scale: Price-based (numeric)

- Use case: Visualizing option chains, price distributions, or any data where price is the primary x-axis metric

`createOptionsChart`
```text
import { createOptionsChart } from 'lightweight-charts';const chart = createOptionsChart(document.getElementById('container'), options);
```

This chart type is particularly useful for financial instruments like options, where the price is a more relevant x-axis metric than time.

```text
const chartOptions = {    layout: { textColor: 'black', background: { type: 'solid', color: 'white' } },};const chart = createOptionsChart(document.getElementById('container'), chartOptions);const lineSeries = chart.addSeries(LineSeries, { color: '#2962FF' });const data = [];for (let i = 0; i < 1000; i++) {    data.push({        time: i * 0.25,        value: Math.sin(i / 100) + i / 500,    });}lineSeries.setData(data);chart.timeScale().fitContent();
```

## Custom Horizontal Scale Chart​

For advanced use cases, Lightweight Charts allows creating charts with custom horizontal scale behavior.

- Creation method: createChartEx

- Horizontal scale: Custom-defined

- Use case: Specialized charting needs with non-standard horizontal scales

`createChartEx`
```text
import { createChartEx, defaultHorzScaleBehavior } from 'lightweight-charts';const customBehavior = new (defaultHorzScaleBehavior())();// Customize the behavior as neededconst chart = createChartEx(document.getElementById('container'), customBehavior, options);
```

This method provides the flexibility to define custom horizontal scale behavior, allowing for unique and specialized chart types.

## Choosing the Right Chart Type​

- Use createChart for most standard time-based charting needs.

- Choose createYieldCurveChart when working specifically with yield curves or similar financial data.

- Opt for createOptionsChart when you need to visualize data with price as the primary horizontal axis, such as option chains.

- Use createChartEx when you need a custom horizontal scale behavior that differs from the standard time-based or price-based scales.

`createChart`
`createYieldCurveChart`
`createOptionsChart`
`createChartEx`
Each chart type provides specific functionality and is optimized for different use cases. Consider your data structure and visualization requirements when selecting the appropriate chart type for your application.

- Standard Time-based ChartYield Curve ChartOptions Chart (Price-based)Custom Horizontal Scale ChartChoosing the Right Chart Type

---

# lightweight-charts docs api interfaces ISeriesPrimitiveBase

Base interface for series primitives. It must be implemented to add some external graphics to series

## Type parameters​

• TSeriesAttachedParameters = unknown

`unknown`
## Methods​

### updateAllViews()?​

optional updateAllViews(): void

`optional`
`void`
This method is called when viewport has been changed, so primitive have to recalculate / invalidate its data

#### Returns​

void

`void`
### priceAxisViews()?​

optional priceAxisViews(): readonly ISeriesPrimitiveAxisView[]

`optional`
`ISeriesPrimitiveAxisView`
Returns array of labels to be drawn on the price axis used by the series

#### Returns​

readonly ISeriesPrimitiveAxisView[]

`ISeriesPrimitiveAxisView`
array of objects; each of then must implement ISeriesPrimitiveAxisView interface

For performance reasons, the lightweight library uses internal caches based on references to arrays
So, this method must return new array if set of views has changed and should try to return the same array if nothing changed

### timeAxisViews()?​

optional timeAxisViews(): readonly ISeriesPrimitiveAxisView[]

`optional`
`ISeriesPrimitiveAxisView`
Returns array of labels to be drawn on the time axis

#### Returns​

readonly ISeriesPrimitiveAxisView[]

`ISeriesPrimitiveAxisView`
array of objects; each of then must implement ISeriesPrimitiveAxisView interface

For performance reasons, the lightweight library uses internal caches based on references to arrays
So, this method must return new array if set of views has changed and should try to return the same array if nothing changed

### paneViews()?​

optional paneViews(): readonly IPrimitivePaneView[]

`optional`
`IPrimitivePaneView`
Returns array of objects representing primitive in the main area of the chart

#### Returns​

readonly IPrimitivePaneView[]

`IPrimitivePaneView`
array of objects; each of then must implement ISeriesPrimitivePaneView interface

For performance reasons, the lightweight library uses internal caches based on references to arrays
So, this method must return new array if set of views has changed and should try to return the same array if nothing changed

### priceAxisPaneViews()?​

optional priceAxisPaneViews(): readonly IPrimitivePaneView[]

`optional`
`IPrimitivePaneView`
Returns array of objects representing primitive in the price axis area of the chart

#### Returns​

readonly IPrimitivePaneView[]

`IPrimitivePaneView`
array of objects; each of then must implement ISeriesPrimitivePaneView interface

For performance reasons, the lightweight library uses internal caches based on references to arrays
So, this method must return new array if set of views has changed and should try to return the same array if nothing changed

### timeAxisPaneViews()?​

optional timeAxisPaneViews(): readonly IPrimitivePaneView[]

`optional`
`IPrimitivePaneView`
Returns array of objects representing primitive in the time axis area of the chart

#### Returns​

readonly IPrimitivePaneView[]

`IPrimitivePaneView`
array of objects; each of then must implement ISeriesPrimitivePaneView interface

For performance reasons, the lightweight library uses internal caches based on references to arrays
So, this method must return new array if set of views has changed and should try to return the same array if nothing changed

### autoscaleInfo()?​

optional autoscaleInfo(startTimePoint, endTimePoint): AutoscaleInfo

`optional`
`startTimePoint`
`endTimePoint`
`AutoscaleInfo`
Return autoscaleInfo which will be merged with the series base autoscaleInfo. You can use this to expand the autoscale range
to include visual elements drawn outside of the series' current visible price range.

Important: Please note that this method will be evoked very often during scrolling and zooming of the chart, thus it
is recommended that this method is either simple to execute, or makes use of optimisations such as caching to ensure that
the chart remains responsive.

#### Parameters​

• startTimePoint: Logical

`Logical`
start time point for the current visible range

• endTimePoint: Logical

`Logical`
end time point for the current visible range

#### Returns​

AutoscaleInfo

`AutoscaleInfo`
AutoscaleInfo

### attached()?​

optional attached(param): void

`optional`
`param`
`void`
Attached Lifecycle hook.

#### Parameters​

• param: TSeriesAttachedParameters

`TSeriesAttachedParameters`
An object containing useful references for the attached primitive to use.

#### Returns​

void

`void`
void

### detached()?​

optional detached(): void

`optional`
`void`
Detached Lifecycle hook.

#### Returns​

void

`void`
void

### hitTest()?​

optional hitTest(x, y): PrimitiveHoveredItem

`optional`
`x`
`y`
`PrimitiveHoveredItem`
Hit test method which will be called by the library when the cursor is moved.
Use this to register object ids being hovered for use within the crosshairMoved
and click events emitted by the chart. Additionally, the hit test result can
specify a preferred cursor type to display for the main chart pane. This method
should return the top most hit for this primitive if more than one object is
being intersected.

#### Parameters​

• x: number

`number`
x Coordinate of mouse event

• y: number

`number`
y Coordinate of mouse event

#### Returns​

PrimitiveHoveredItem

`PrimitiveHoveredItem`
- Type parametersMethodsupdateAllViews()?priceAxisViews()?timeAxisViews()?paneViews()?priceAxisPaneViews()?timeAxisPaneViews()?autoscaleInfo()?attached()?detached()?hitTest()?

- updateAllViews()?priceAxisViews()?timeAxisViews()?paneViews()?priceAxisPaneViews()?timeAxisPaneViews()?autoscaleInfo()?attached()?detached()?hitTest()?

---

# lightweight-charts docs api interfaces SeriesAttachedParameter

Object containing references to the chart and series instances, and a requestUpdate method for triggering
a refresh of the chart.

## Type parameters​

• HorzScaleItem = Time

`Time`
• TSeriesType extends SeriesType = keyof SeriesOptionsMap

`SeriesType`
`SeriesOptionsMap`
## Properties​

### chart​

chart: IChartApiBase<HorzScaleItem>

`IChartApiBase`
`HorzScaleItem`
Chart instance.

### series​

series: ISeriesApi<TSeriesType, HorzScaleItem, SeriesDataItemTypeMap<HorzScaleItem>[TSeriesType], SeriesOptionsMap[TSeriesType], SeriesPartialOptionsMap[TSeriesType]>

`ISeriesApi`
`TSeriesType`
`HorzScaleItem`
`SeriesDataItemTypeMap`
`HorzScaleItem`
`TSeriesType`
`SeriesOptionsMap`
`TSeriesType`
`SeriesPartialOptionsMap`
`TSeriesType`
Series to which the Primitive is attached.

### requestUpdate()​

requestUpdate: () => void

`void`
Request an update (redraw the chart)

#### Returns​

void

`void`
### horzScaleBehavior​

horzScaleBehavior: IHorzScaleBehavior<HorzScaleItem>

`IHorzScaleBehavior`
`HorzScaleItem`
Horizontal Scale Behaviour for the chart.

- Type parametersPropertieschartseriesrequestUpdate()horzScaleBehavior

- chartseriesrequestUpdate()horzScaleBehavior

---

# lightweight-charts docs plugins series-primitives

Primitives are extensions to the series which can define views and renderers to
draw on the chart using
CanvasRenderingContext2D.

Primitives are defined by implementing the
ISeriesPrimitive interface. The
interface defines the basic functionality and structure required for creating
custom primitives.

`ISeriesPrimitive`
## Views​

The primary purpose of a series primitive is to provide one, or more, views to
the library which contain the state and logic required to draw on the chart
panes.

There are two types of views which are supported within ISeriesPrimitive which
are:

`ISeriesPrimitive`
- IPrimitivePaneView

- ISeriesPrimitiveAxisView

`IPrimitivePaneView`
`ISeriesPrimitiveAxisView`
The library will evoke the following getter functions (if defined) to get
references to the primitive's defined views for the corresponding section of the
chart:

- paneViews

- priceAxisPaneViews

- timeAxisPaneViews

- priceAxisViews

- timeAxisViews

`paneViews`
`priceAxisPaneViews`
`timeAxisPaneViews`
`priceAxisViews`
`timeAxisViews`
The first three views allow drawing on the corresponding panes (main chart pane,
price scale pane, and horizontal time scale pane) using the
CanvasRenderingContext2D
and should implement the ISeriesPrimitivePaneView interface.

`ISeriesPrimitivePaneView`
The views returned by the priceAxisViews and timeAxisViews getter methods
should implement the ISeriesPrimitiveAxisView interface and are used to define
labels to be drawn on the corresponding scales.

`priceAxisViews`
`timeAxisViews`
`ISeriesPrimitiveAxisView`
Below is a visual example showing the various sections of the chart where a
Primitive can draw.

### IPrimitivePaneView​

The IPrimitivePaneView
interface can be used to define a view which provides a renderer (implementing
the
IPrimitivePaneRenderer
interface) for drawing on the corresponding area of the chart using the
CanvasRenderingContext2D
API. The view can define a
zOrder to control where
in the visual stack the drawing will occur (See
PrimitivePaneViewZOrder
for more information).

`IPrimitivePaneView`
`IPrimitivePaneRenderer`
`zOrder`
`PrimitivePaneViewZOrder`
Renderers should provide a
draw method which will
be given a CanvasRenderingTarget2D target on which it can draw. Additionally,
a renderer can optionally provide a
drawBackground
method for drawing beneath other elements on the same zOrder.

`draw`
`CanvasRenderingTarget2D`
`drawBackground`
CanvasRenderingTarget2D is explained in more detail on the Canvas Rendering Target page.

`CanvasRenderingTarget2D`
#### Interactive Demo of zOrder layers​

Below is an interactive demo chart illustrating where each zOrder is drawn
relative to the existing chart elements such as the grid, series, and crosshair.

### ISeriesPrimitiveAxisView​

The ISeriesPrimitiveAxisView
interface can be used to define a label on the price or time axis.

`ISeriesPrimitiveAxisView`
This interface provides several methods to define the appearance and position of
the label, such as the
coordinate method,
which should return the desired coordinate for the label on the axis. It also
defines optional methods to set the fixed coordinate, text, text color,
background color, and visibility of the label.

`coordinate`
Please see the
ISeriesPrimitiveAxisView
interface for more details.

`ISeriesPrimitiveAxisView`
## Lifecycle Methods​

Your primitive can use the
attached and
detached lifecycle methods to
manage the lifecycle of the primitive, such as creating or removing external
objects and event handlers.

`attached`
`detached`
### attached​

This method is called when the primitive is attached to a chart. The attached
method is evoked with a
single argument containing
properties for the chart, series, and a callback to request an update. The
chart and series properties are references to the chart API and the series
API instances for convenience purposes so that they don't need to be manually
provided within the primitive's constructor (if needed by the primitive).

`chart`
`series`
The requestUpdate callback allows the primitive to notify the chart that it
should be updated and redrawn.

`requestUpdate`
### detached​

This method is called when the primitive is detached from a chart. This can be
used to remove any external objects or event handlers that were created during
the attached lifecycle method.

## Updating Views​

Your primitive should update the views in the
updateAllViews() method
such that when the renderers are evoked, they can draw with the latest
information. The library invokes this method when it wants to update and redraw
the chart. If you would like to notify the library that it should trigger an
update then you can use the requestUpdate callback provided by the attached
lifecycle method.

`updateAllViews()`
`requestUpdate`
## Extending the Autoscale Info​

The autoscaleInfo()
method can be provided to extend the base autoScale information of the series.
This can be used to ensure that the chart is automatically scaled correctly to
include all the graphics drawn by the primitive.

`autoscaleInfo()`
Whenever the chart needs to calculate the vertical visible range of the series
within the current time range then it will evoke this method. This method can be
omitted and the library will use the normal autoscale information for the
series. If the method is implemented then the returned values will be merged
with the base autoscale information to define the vertical visible range.

Please note that this method will be evoked very often during
scrolling and zooming of the chart, thus it is recommended that this method is
either simple to execute, or makes use of optimisations such as caching to
ensure that the chart remains responsive.

- ViewsIPrimitivePaneViewISeriesPrimitiveAxisViewLifecycle MethodsattacheddetachedUpdating ViewsExtending the Autoscale Info

- IPrimitivePaneViewISeriesPrimitiveAxisView

- attacheddetached

---

# lightweight-charts docs plugins custom_series

Custom series allow developers to create new types of series with their own data
structures, and rendering logic (implemented using
CanvasRenderingContext2D
methods). These custom series extend the current capabilities of our built-in
series, providing a consistent API which mirrors the built-in chart types.

These series are expected to have a uniform width for each data point, which
ensures that the chart maintains a consistent look and feel across all series
types. The only restriction on the data structure is that it should extend the
CustomData interface (have a valid time
property for each data point).

`CustomData`
## Defining a Custom Series​

A custom series should implement the
ICustomSeriesPaneView interface.
The interface defines the basic functionality and structure required for
creating a custom series view.

`ICustomSeriesPaneView`
It includes the following methods and properties:

### Renderer​

- ICustomSeriesPaneView property:
renderer

`renderer`
This method should return a renderer which implements the
ICustomSeriesPaneRenderer
interface and is used to draw the series data on the main chart pane.

`ICustomSeriesPaneRenderer`
The draw method of the
renderer is evoked whenever the chart needs to draw the series.

`draw`
The PriceToCoordinateConverter
provided as the 2nd argument to the draw method is a convenience function for
changing prices into vertical coordinate values. It is provided since the
series' original data will most likely be defined in price values, and the
renderer needs to draw with coordinates. The values returned by the converter
will be defined in mediaSize (unscaled by devicePixelRatio).

`PriceToCoordinateConverter`
`devicePixelRatio`
CanvasRenderingTarget2D provided within the draw function is explained in
more detail on the Canvas Rendering Target page.

`CanvasRenderingTarget2D`
`draw`
### Update​

- ICustomSeriesPaneView property:
update

`update`
This method will be called with the latest data for the renderer to use during
the next paint.

The update method is evoked with two parameters: data (discussed below), and
seriesOptions. seriesOptions is a reference to the currently applied options
for the series

`data`
`seriesOptions`
The PaneRendererCustomData
interface provides the data that can be used within the renderer for drawing the
series data. It includes the following properties:

`PaneRendererCustomData`
- bars: List of all the series' items and their x coordinates. See
CustomBarItemData for more details

- barSpacing: Spacing between consecutive bars.

- visibleRange: The current visible range of items on the chart.

`bars`
`CustomBarItemData`
`barSpacing`
`visibleRange`
### Price Value Builder​

- ICustomSeriesPaneView property:
priceValueBuilder

`priceValueBuilder`
A function for interpreting the custom series data and returning an array of
numbers representing the prices values for the item, specifically the equivalent
highest, lowest, and current price values for the data item.

These price values are used by the chart to determine the auto-scaling (to
ensure the items are in view) and the crosshair and price line positions. The
largest and smallest values in the array will be used to specify the visible
range of the painted item, and the last value will be used for the crosshair and
price line position.

### Whitespace​

- ICustomSeriesPaneView property:
isWhitespace

`isWhitespace`
A function used by the library to determine which data points provided by the
user should be considered Whitespace. The method should return true when the
data point is Whitespace. Data points which are whitespace data won't be provided to
the renderer, or the priceValueBuilder.

`true`
`priceValueBuilder`
### Default Options​

- ICustomSeriesPaneView property:
defaultOptions

`defaultOptions`
The default options to be used for the series. The user can override these
values using the options argument in
addCustomSeries, or via the
applyOptions method on the
ISeriesAPI.

`addCustomSeries`
`applyOptions`
`ISeriesAPI`
### Destroy​

- ICustomSeriesPaneView property:
destroy

`destroy`
This method will be evoked when the series has been removed from the chart. This
method should be used to clean up any objects, references, and other items that
could potentially cause memory leaks.

This method should contain all the necessary code to clean up the object before
it is removed from memory. This includes removing any event listeners or timers
that are attached to the object, removing any references to other objects, and
resetting any values or properties that were modified during the lifetime of the
object.

- Defining a Custom SeriesRendererUpdatePrice Value BuilderWhitespaceDefault OptionsDestroy

- RendererUpdatePrice Value BuilderWhitespaceDefault OptionsDestroy

---

# lightweight-charts docs plugins pane-primitives

In addition to Series Primitives, the library now supports Pane Primitives. These are essentially the same as Series Primitives but are designed to draw on the pane of a chart rather than being associated with a specific series. Pane Primitives can be used for features like watermarks or other chart-wide annotations.

## Key Differences from Series Primitives​

- Pane Primitives are attached to the chart pane rather than a specific series.

- They cannot draw on the price and time scales.

- They are ideal for chart-wide features that are not tied to a particular series.

## Adding a Pane Primitive​

Pane Primitives can be added to a chart using the attachPrimitive method on the IPaneApi interface. Here's an example:

`attachPrimitive`
`IPaneApi`
```text
const chart = createChart(document.getElementById('container'));const pane = chart.panes()[0]; // Get the first (main) paneconst myPanePrimitive = new MyCustomPanePrimitive();pane.attachPrimitive(myPanePrimitive);
```

## Implementing a Pane Primitive​

To create a Pane Primitive, you should implement the IPanePrimitive interface. This interface is similar to ISeriesPrimitive, but with some key differences:

`IPanePrimitive`
`ISeriesPrimitive`
- It doesn't include methods for drawing on price and time scales.

- The paneViews method is used to define what will be drawn on the chart pane.

`paneViews`
Here's a basic example of a Pane Primitive implementation:

```text
class MyCustomPanePrimitive {    paneViews() {        return [            {                renderer: {                    draw: target => {                        // Custom drawing logic here                    },                },            },        ];    }    // Other methods as needed...}
```

For more details on implementing Pane Primitives, refer to the IPanePrimitive interface documentation.

`IPanePrimitive`
- Key Differences from Series PrimitivesAdding a Pane PrimitiveImplementing a Pane Primitive

---

# lightweight-charts docs api interfaces Point

Represents a point on the chart.

## Properties​

### x​

readonly x: Coordinate

`readonly`
`Coordinate`
The x coordinate.

### y​

readonly y: Coordinate

`readonly`
`Coordinate`
The y coordinate.

- Propertiesxy

- xy

---

# lightweight-charts docs api interfaces TouchMouseEventData

The TouchMouseEventData interface represents events that occur due to the user interacting with a
pointing device (such as a mouse).
See MouseEvent

## Properties​

### clientX​

readonly clientX: Coordinate

`readonly`
`Coordinate`
The X coordinate of the mouse pointer in local (DOM content) coordinates.

### clientY​

readonly clientY: Coordinate

`readonly`
`Coordinate`
The Y coordinate of the mouse pointer in local (DOM content) coordinates.

### pageX​

readonly pageX: Coordinate

`readonly`
`Coordinate`
The X coordinate of the mouse pointer relative to the whole document.

### pageY​

readonly pageY: Coordinate

`readonly`
`Coordinate`
The Y coordinate of the mouse pointer relative to the whole document.

### screenX​

readonly screenX: Coordinate

`readonly`
`Coordinate`
The X coordinate of the mouse pointer in global (screen) coordinates.

### screenY​

readonly screenY: Coordinate

`readonly`
`Coordinate`
The Y coordinate of the mouse pointer in global (screen) coordinates.

### localX​

readonly localX: Coordinate

`readonly`
`Coordinate`
The X coordinate of the mouse pointer relative to the chart / price axis / time axis canvas element.

### localY​

readonly localY: Coordinate

`readonly`
`Coordinate`
The Y coordinate of the mouse pointer relative to the chart / price axis / time axis canvas element.

### ctrlKey​

readonly ctrlKey: boolean

`readonly`
`boolean`
Returns a boolean value that is true if the Ctrl key was active when the key event was generated.

### altKey​

readonly altKey: boolean

`readonly`
`boolean`
Returns a boolean value that is true if the Alt (Option or ⌥ on macOS) key was active when the
key event was generated.

### shiftKey​

readonly shiftKey: boolean

`readonly`
`boolean`
Returns a boolean value that is true if the Shift key was active when the key event was generated.

### metaKey​

readonly metaKey: boolean

`readonly`
`boolean`
Returns a boolean value that is true if the Meta key (on Mac keyboards, the ⌘ Command key; on
Windows keyboards, the Windows key (⊞)) was active when the key event was generated.

- PropertiesclientXclientYpageXpageYscreenXscreenYlocalXlocalYctrlKeyaltKeyshiftKeymetaKey

- clientXclientYpageXpageYscreenXscreenYlocalXlocalYctrlKeyaltKeyshiftKeymetaKey

---

# lightweight-charts docs api interfaces PaneAttachedParameter

Object containing references to the chart instance, and a requestUpdate method for triggering
a refresh of the chart.

## Type parameters​

• HorzScaleItem = Time

`Time`
## Properties​

### chart​

chart: IChartApiBase<HorzScaleItem>

`IChartApiBase`
`HorzScaleItem`
Chart instance.

### requestUpdate()​

requestUpdate: () => void

`void`
Request an update (redraw the chart)

#### Returns​

void

`void`
- Type parametersPropertieschartrequestUpdate()

- chartrequestUpdate()

---

# lightweight-charts docs api interfaces IPanePrimitiveBase

Base interface for series primitives. It must be implemented to add some external graphics to series

## Type parameters​

• TPaneAttachedParameters = unknown

`unknown`
## Methods​

### updateAllViews()?​

optional updateAllViews(): void

`optional`
`void`
This method is called when viewport has been changed, so primitive have to recalculate / invalidate its data

#### Returns​

void

`void`
### paneViews()?​

optional paneViews(): readonly IPanePrimitivePaneView[]

`optional`
`IPanePrimitivePaneView`
Returns array of objects representing primitive in the main area of the chart

#### Returns​

readonly IPanePrimitivePaneView[]

`IPanePrimitivePaneView`
array of objects; each of then must implement IPrimitivePaneView interface

For performance reasons, the lightweight library uses internal caches based on references to arrays
So, this method must return new array if set of views has changed and should try to return the same array if nothing changed

### attached()?​

optional attached(param): void

`optional`
`param`
`void`
Attached Lifecycle hook.

#### Parameters​

• param: TPaneAttachedParameters

`TPaneAttachedParameters`
An object containing useful references for the attached primitive to use.

#### Returns​

void

`void`
void

### detached()?​

optional detached(): void

`optional`
`void`
Detached Lifecycle hook.

#### Returns​

void

`void`
void

### hitTest()?​

optional hitTest(x, y): PrimitiveHoveredItem

`optional`
`x`
`y`
`PrimitiveHoveredItem`
Hit test method which will be called by the library when the cursor is moved.
Use this to register object ids being hovered for use within the crosshairMoved
and click events emitted by the chart. Additionally, the hit test result can
specify a preferred cursor type to display for the main chart pane. This method
should return the top most hit for this primitive if more than one object is
being intersected.

#### Parameters​

• x: number

`number`
x Coordinate of mouse event

• y: number

`number`
y Coordinate of mouse event

#### Returns​

PrimitiveHoveredItem

`PrimitiveHoveredItem`
- Type parametersMethodsupdateAllViews()?paneViews()?attached()?detached()?hitTest()?

- updateAllViews()?paneViews()?attached()?detached()?hitTest()?

---

# lightweight-charts docs api type-aliases SeriesPartialOptions

SeriesPartialOptions<T>: DeepPartial<T & SeriesOptionsCommon>

`T`
`DeepPartial`
`T`
`SeriesOptionsCommon`
Represents a SeriesOptions where every property is optional.

## Type parameters​

• T

- Type parameters

---

# lightweight-charts docs api interfaces CustomBarItemData

Renderer data for an item within the custom series.

## Type parameters​

• HorzScaleItem

• TData extends CustomData<HorzScaleItem> = CustomData<HorzScaleItem>

`CustomData`
`HorzScaleItem`
`CustomData`
`HorzScaleItem`
## Properties​

### x​

x: number

`number`
Horizontal coordinate for the item. Measured from the left edge of the pane in pixels.

### time​

time: number

`number`
Time scale index for the item. This isn't the timestamp but rather the logical index.

### originalData​

originalData: TData

`TData`
Original data for the item.

### barColor​

barColor: string

`string`
Color assigned for the item, typically used for price line and price scale label.

- Type parametersPropertiesxtimeoriginalDatabarColor

- xtimeoriginalDatabarColor

---

# lightweight-charts docs api type-aliases PriceToCoordinateConverter

PriceToCoordinateConverter: (price) => Coordinate | null

`price`
`Coordinate`
`null`
Converter function for changing prices into vertical coordinate values.

This is provided as a convenience function since the series original data will most likely be defined
in price values, and the renderer needs to draw with coordinates. This returns the same values as
directly using the series' priceToCoordinate method.

## Parameters​

• price: number

`number`
## Returns​

Coordinate | null

`Coordinate`
`null`
- ParametersReturns

---

# lightweight-charts docs api interfaces LocalizationOptionsBase

Represents basic localization options

## Extended by​

- LocalizationOptions

`LocalizationOptions`
## Properties​

### locale​

locale: string

`string`
Current locale used to format dates. Uses the browser's language settings by default.

#### See​

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation

#### Default Value​

navigator.language

`navigator.language`
### priceFormatter?​

optional priceFormatter: PriceFormatterFn

`optional`
`PriceFormatterFn`
Override formatting of the price scale tick marks, labels and crosshair labels. Can be used for cases that can't be covered with built-in price formats.

#### See​

PriceFormatCustom

#### Default Value​

undefined

`undefined`
### tickmarksPriceFormatter?​

optional tickmarksPriceFormatter: TickmarksPriceFormatterFn

`optional`
`TickmarksPriceFormatterFn`
Overrides the formatting of price scale tick marks. Use this to define formatting rules based on all provided price values.

#### Default Value​

undefined

`undefined`
### percentageFormatter?​

optional percentageFormatter: PercentageFormatterFn

`optional`
`PercentageFormatterFn`
Overrides the formatting of percentage scale tick marks.

#### Default Value​

undefined

`undefined`
### tickmarksPercentageFormatter?​

optional tickmarksPercentageFormatter: TickmarksPercentageFormatterFn

`optional`
`TickmarksPercentageFormatterFn`
Override formatting of the percentage scale tick marks. Can be used if formatting should be adjusted based on all the values being formatted

#### Default Value​

undefined

`undefined`
- Extended byPropertieslocalepriceFormatter?tickmarksPriceFormatter?percentageFormatter?tickmarksPercentageFormatter?

- localepriceFormatter?tickmarksPriceFormatter?percentageFormatter?tickmarksPercentageFormatter?

---

# lightweight-charts docs api interfaces CrosshairLineOptions

Structure describing a crosshair line (vertical or horizontal)

## Properties​

### color​

color: string

`string`
Crosshair line color.

#### Default Value​

'#758696'

`'#758696'`
### width​

width: LineWidth

`LineWidth`
Crosshair line width.

#### Default Value​

1

`1`
### style​

style: LineStyle

`LineStyle`
Crosshair line style.

#### Default Value​

```text
{@link LineStyle.LargeDashed}
```

### visible​

visible: boolean

`boolean`
Display the crosshair line.

Note that disabling crosshair lines does not disable crosshair marker on Line and Area series.
It can be disabled by using crosshairMarkerVisible option of a relevant series.

`crosshairMarkerVisible`
#### See​

- LineStyleOptions.crosshairMarkerVisible

- AreaStyleOptions.crosshairMarkerVisible

- BaselineStyleOptions.crosshairMarkerVisible

#### Default Value​

true

`true`
### labelVisible​

labelVisible: boolean

`boolean`
Display the crosshair label on the relevant scale.

#### Default Value​

true

`true`
### labelBackgroundColor​

labelBackgroundColor: string

`string`
Crosshair label background color.

#### Default Value​

'#4c525e'

`'#4c525e'`
- PropertiescolorwidthstylevisiblelabelVisiblelabelBackgroundColor

- colorwidthstylevisiblelabelVisiblelabelBackgroundColor

---

# lightweight-charts docs api enumerations CrosshairMode

Represents the crosshair mode.

## Enumeration Members​

### Normal​

Normal: 0

`0`
This mode allows crosshair to move freely on the chart.

### Magnet​

Magnet: 1

`1`
This mode sticks crosshair's horizontal line to the price value of a single-value series or to the close price of OHLC-based series.

### Hidden​

Hidden: 2

`2`
This mode disables rendering of the crosshair.

### MagnetOHLC​

MagnetOHLC: 3

`3`
This mode sticks crosshair's horizontal line to the price value of a single-value series or to the open/high/low/close price of OHLC-based series.

- Enumeration MembersNormalMagnetHiddenMagnetOHLC

- NormalMagnetHiddenMagnetOHLC

---

# lightweight-charts docs api interfaces GridLineOptions

Grid line options.

## Properties​

### color​

color: string

`string`
Line color.

#### Default Value​

'#D6DCDE'

`'#D6DCDE'`
### style​

style: LineStyle

`LineStyle`
Line style.

#### Default Value​

```text
{@link LineStyle.Solid}
```

### visible​

visible: boolean

`boolean`
Display the lines.

#### Default Value​

true

`true`
- Propertiescolorstylevisible

- colorstylevisible

---

# lightweight-charts docs api type-aliases PercentageFormatterFn

PercentageFormatterFn: (percentageValue) => string

`percentageValue`
`string`
A function used to format a percentage value as a string.

## Parameters​

• percentageValue: number

`number`
## Returns​

string

`string`
- ParametersReturns

---

# lightweight-charts docs api type-aliases TickmarksPriceFormatterFn

TickmarksPriceFormatterFn: (priceValue) => string[]

`priceValue`
`string`
## Parameters​

• priceValue: BarPrice[]

`BarPrice`
## Returns​

string[]

`string`
- ParametersReturns

---

# lightweight-charts docs api type-aliases PriceFormatterFn

PriceFormatterFn: (priceValue) => string

`priceValue`
`string`
A function used to format a BarPrice as a string.

## Parameters​

• priceValue: BarPrice

`BarPrice`
## Returns​

string

`string`
- ParametersReturns

---

# lightweight-charts docs api type-aliases TimeFormatterFn

TimeFormatterFn<HorzScaleItem>: (time) => string

`HorzScaleItem`
`time`
`string`
A custom function used to override formatting of a time to a string.

## Type parameters​

• HorzScaleItem = Time

`Time`
## Parameters​

• time: HorzScaleItem

`HorzScaleItem`
## Returns​

string

`string`
- Type parametersParametersReturns

---

# lightweight-charts docs api type-aliases TickmarksPercentageFormatterFn

TickmarksPercentageFormatterFn: (percentageValue) => string[]

`percentageValue`
`string`
## Parameters​

• percentageValue: number[]

`number`
## Returns​

string[]

`string`
- ParametersReturns

---

# lightweight-charts docs api interfaces PriceFormatCustom

Represents series value formatting options.

## Properties​

### type​

type: "custom"

`"custom"`
The custom price format.

### formatter​

formatter: PriceFormatterFn

`PriceFormatterFn`
Override price formatting behaviour. Can be used for cases that can't be covered with built-in price formats.

### tickmarksFormatter?​

optional tickmarksFormatter: TickmarksPriceFormatterFn

`optional`
`TickmarksPriceFormatterFn`
Override price formatting for multiple prices. Can be used if formatter should be adjusted based of all values being formatted.

### minMove​

minMove: number

`number`
The minimum possible step size for price value movement.

#### Default Value​

0.01

`0.01`
### base?​

optional base: number

`optional`
`number`
The base value for the price format. It should equal to 1 / minMove.
If this option is specified, we ignore the minMove option.
It can be useful for cases with very small price movements like 1e-18 where we can reach limitations of floating point precision.

`1e-18`
- PropertiestypeformattertickmarksFormatter?minMovebase?

- typeformattertickmarksFormatter?minMovebase?

---

# lightweight-charts docs api interfaces PriceChartLocalizationOptions

Extends LocalizationOptions for price-based charts.
Includes settings specific to formatting price values on the horizontal scale.

## Extends​

- LocalizationOptions <HorzScalePriceItem>

`LocalizationOptions`
`HorzScalePriceItem`
## Properties​

### timeFormatter?​

optional timeFormatter: TimeFormatterFn<number>

`optional`
`TimeFormatterFn`
`number`
Override formatting of the time scale crosshair label.

#### Default Value​

undefined

`undefined`
#### Inherited from​

LocalizationOptions . timeFormatter

`LocalizationOptions`
`timeFormatter`
### dateFormat​

dateFormat: string

`string`
Date formatting string.

Can contain yyyy, yy, MMMM, MMM, MM and dd literals which will be replaced with corresponding date's value.

`yyyy`
`yy`
`MMMM`
`MMM`
`MM`
`dd`
Ignored if timeFormatter has been specified.

#### Default Value​

'dd MMM \'yy'

`'dd MMM \'yy'`
#### Inherited from​

LocalizationOptions . dateFormat

`LocalizationOptions`
`dateFormat`
### locale​

locale: string

`string`
Current locale used to format dates. Uses the browser's language settings by default.

#### See​

https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl#Locale_identification_and_negotiation

#### Default Value​

navigator.language

`navigator.language`
#### Inherited from​

LocalizationOptions . locale

`LocalizationOptions`
`locale`
### priceFormatter?​

optional priceFormatter: PriceFormatterFn

`optional`
`PriceFormatterFn`
Override formatting of the price scale tick marks, labels and crosshair labels. Can be used for cases that can't be covered with built-in price formats.

#### See​

PriceFormatCustom

#### Default Value​

undefined

`undefined`
#### Inherited from​

LocalizationOptions . priceFormatter

`LocalizationOptions`
`priceFormatter`
### tickmarksPriceFormatter?​

optional tickmarksPriceFormatter: TickmarksPriceFormatterFn

`optional`
`TickmarksPriceFormatterFn`
Overrides the formatting of price scale tick marks. Use this to define formatting rules based on all provided price values.

#### Default Value​

undefined

`undefined`
#### Inherited from​

LocalizationOptions . tickmarksPriceFormatter

`LocalizationOptions`
`tickmarksPriceFormatter`
### percentageFormatter?​

optional percentageFormatter: PercentageFormatterFn

`optional`
`PercentageFormatterFn`
Overrides the formatting of percentage scale tick marks.

#### Default Value​

undefined

`undefined`
#### Inherited from​

LocalizationOptions . percentageFormatter

`LocalizationOptions`
`percentageFormatter`
### tickmarksPercentageFormatter?​

optional tickmarksPercentageFormatter: TickmarksPercentageFormatterFn

`optional`
`TickmarksPercentageFormatterFn`
Override formatting of the percentage scale tick marks. Can be used if formatting should be adjusted based on all the values being formatted

#### Default Value​

undefined

`undefined`
#### Inherited from​

LocalizationOptions . tickmarksPercentageFormatter

`LocalizationOptions`
`tickmarksPercentageFormatter`
### precision​

precision: number

`number`
The number of decimal places to display for price values on the horizontal scale.

- ExtendsPropertiestimeFormatter?dateFormatlocalepriceFormatter?tickmarksPriceFormatter?percentageFormatter?tickmarksPercentageFormatter?precision

- timeFormatter?dateFormatlocalepriceFormatter?tickmarksPriceFormatter?percentageFormatter?tickmarksPercentageFormatter?precision

---

# lightweight-charts docs api enumerations TrackingModeExitMode

Determine how to exit the tracking mode.

By default, mobile users will long press to deactivate the scroll and have the ability to check values and dates.
Another press is required to activate the scroll, be able to move left/right, zoom, etc.

## Enumeration Members​

### OnTouchEnd​

OnTouchEnd: 0

`0`
Tracking Mode will be deactivated on touch end event.

### OnNextTap​

OnNextTap: 1

`1`
Tracking Mode will be deactivated on the next tap event.

- Enumeration MembersOnTouchEndOnNextTap

- OnTouchEndOnNextTap

---

# lightweight-charts docs api interfaces PriceScaleMargins

Defines margins of the price scale.

## Properties​

### top​

top: number

`number`
Top margin in percentages. Must be greater or equal to 0 and less than 1.

### bottom​

bottom: number

`number`
Bottom margin in percentages. Must be greater or equal to 0 and less than 1.

- Propertiestopbottom

- topbottom

---

# lightweight-charts docs api enumerations PriceScaleMode

Represents the price scale mode.

## Enumeration Members​

### Normal​

Normal: 0

`0`
Price scale shows prices. Price range changes linearly.

### Logarithmic​

Logarithmic: 1

`1`
Price scale shows prices. Price range changes logarithmically.

### Percentage​

Percentage: 2

`2`
Price scale shows percentage values according the first visible value of the price scale.
The first visible value is 0% in this mode.

### IndexedTo100​

IndexedTo100: 3

`3`
The same as percentage mode, but the first value is moved to 100.

- Enumeration MembersNormalLogarithmicPercentageIndexedTo100

- NormalLogarithmicPercentageIndexedTo100

---

# lightweight-charts docs api interfaces YieldCurveOptions

Options specific to yield curve charts.

## Properties​

### baseResolution​

baseResolution: number

`number`
The smallest time unit for the yield curve, typically representing one month.
This value determines the granularity of the time scale.

#### Default Value​

```text
1
```

### minimumTimeRange​

minimumTimeRange: number

`number`
The minimum time range to be displayed on the chart, in units of baseResolution.
This ensures that the chart always shows at least this much time range, even if there's less data.

#### Default Value​

```text
120 (10 years)
```

### startTimeRange​

startTimeRange: number

`number`
The starting time value for the chart, in units of baseResolution.
This determines where the time scale begins.

#### Default Value​

```text
0
```

### formatTime()?​

optional formatTime: (months) => string

`optional`
`months`
`string`
Optional custom formatter for time values on the horizontal axis.
If not provided, a default formatter will be used.

#### Parameters​

• months: number

`number`
The number of months (or baseResolution units) to format

#### Returns​

string

`string`
- PropertiesbaseResolutionminimumTimeRangestartTimeRangeformatTime()?

- baseResolutionminimumTimeRangestartTimeRangeformatTime()?

---

# lightweight-charts docs api interfaces AxisDoubleClickOptions

Represents options for how the time and price axes react to mouse double click.

## Properties​

### time​

time: boolean

`boolean`
Enable resetting scaling the time axis by double-clicking the left mouse button.

#### Default Value​

true

`true`
### price​

price: boolean

`boolean`
Enable reseting scaling the price axis by by double-clicking the left mouse button.

#### Default Value​

true

`true`
- Propertiestimeprice

- timeprice

---

# lightweight-charts docs api interfaces AxisPressedMouseMoveOptions

Represents options for how the time and price axes react to mouse movements.

## Properties​

### time​

time: boolean

`boolean`
Enable scaling the time axis by holding down the left mouse button and moving the mouse.

#### Default Value​

true

`true`
### price​

price: boolean

`boolean`
Enable scaling the price axis by holding down the left mouse button and moving the mouse.

#### Default Value​

true

`true`
- Propertiestimeprice

- timeprice

---

# lightweight-charts docs api type-aliases CustomColorParser

CustomColorParser: (color) => Rgba | null

`color`
`Rgba`
`null`
## Parameters​

• color: string

`string`
## Returns​

Rgba | null

`Rgba`
`null`
- ParametersReturns

---

# lightweight-charts docs api interfaces LayoutPanesOptions

Represents panes customizations.

## Properties​

### enableResize​

enableResize: boolean

`boolean`
Enable panes resizing

#### Default Value​

true

`true`
### separatorColor​

separatorColor: string

`string`
Color of pane separator

#### Default Value​

#2B2B43

`#2B2B43`
### separatorHoverColor​

separatorHoverColor: string

`string`
Color of pane separator background applied on hover

#### Default Value​

rgba(178, 181, 189, 0.2)

`rgba(178, 181, 189, 0.2)`
- PropertiesenableResizeseparatorColorseparatorHoverColor

- enableResizeseparatorColorseparatorHoverColor

---

# lightweight-charts docs api type-aliases ColorSpace

ColorSpace: "display-p3" | "srgb"

`"display-p3"`
`"srgb"`

---

# lightweight-charts docs api type-aliases Background

Background: SolidColor | VerticalGradientColor

`SolidColor`
`VerticalGradientColor`
Represents the background color of the chart.

---

# lightweight-charts docs api type-aliases Rgba

Rgba: [RedComponent, GreenComponent, BlueComponent, AlphaComponent]

`RedComponent`
`GreenComponent`
`BlueComponent`
`AlphaComponent`

---

# lightweight-charts docs api type-aliases InternalHorzScaleItem

InternalHorzScaleItem: Nominal<unknown, "InternalHorzScaleItem">

`Nominal`
`unknown`
`"InternalHorzScaleItem"`
Internal Horizontal Scale Item

---

# lightweight-charts docs api interfaces PriceFormatBuiltIn

Represents series value formatting options.
The precision and minMove properties allow wide customization of formatting.

## Examples​

```text
`minMove=0.01`, `precision` is not specified - prices will change like 1.13, 1.14, 1.15 etc.
```

```text
`minMove=0.01`, `precision=3` - prices will change like 1.130, 1.140, 1.150 etc.
```

```text
`minMove=0.05`, `precision` is not specified - prices will change like 1.10, 1.15, 1.20 etc.
```

## Properties​

### type​

type: "percent" | "price" | "volume"

`"percent"`
`"price"`
`"volume"`
Built-in price formats:

- 'price' is the most common choice; it allows customization of precision and rounding of prices.

- 'volume' uses abbreviation for formatting prices like 1.2K or 12.67M.

- 'percent' uses % sign at the end of prices.

`'price'`
`'volume'`
`1.2K`
`12.67M`
`'percent'`
`%`
### precision​

precision: number

`number`
Number of digits after the decimal point.
If it is not set, then its value is calculated automatically based on minMove.

#### Default Value​

2 if both minMove and precision are not provided, calculated automatically based on minMove otherwise.

`2`
### minMove​

minMove: number

`number`
The minimum possible step size for price value movement. This value shouldn't have more decimal digits than the precision.

#### Default Value​

0.01

`0.01`
### base?​

optional base: number

`optional`
`number`
The base value for the price format. It should equal to 1 / minMove.
If this option is specified, we ignore the minMove option.
It can be useful for cases with very small price movements like 1e-18 where we can reach limitations of floating point precision.

`1e-18`
- ExamplesPropertiestypeprecisionminMovebase?

- typeprecisionminMovebase?

---

# lightweight-charts docs api interfaces AutoScaleMargins

Represents the margin used when updating a price scale.

## Properties​

### below​

below: number

`number`
The number of pixels for bottom margin

### above​

above: number

`number`
The number of pixels for top margin

- Propertiesbelowabove

- belowabove

---

# lightweight-charts docs api interfaces PriceRange

Represents a price range.

## Properties​

### minValue​

minValue: number

`number`
Maximum value in the range.

### maxValue​

maxValue: number

`number`
Minimum value in the range.

- PropertiesminValuemaxValue

- minValuemaxValue

---

# lightweight-charts docs api type-aliases TickMarkFormatter

TickMarkFormatter: (time, tickMarkType, locale) => string | null

`time`
`tickMarkType`
`locale`
`string`
`null`
The TickMarkFormatter is used to customize tick mark labels on the time scale.

`TickMarkFormatter`
This function should return time as a string formatted according to tickMarkType type (year, month, etc) and locale.

`time`
`tickMarkType`
`locale`
Note that the returned string should be the shortest possible value and should have no more than 8 characters.
Otherwise, the tick marks will overlap each other.

If the formatter function returns null then the default tick mark formatter will be used as a fallback.

`null`
## Example​

```text
const customFormatter = (time, tickMarkType, locale) => {    // your code here};
```

## Parameters​

• time: Time

`Time`
• tickMarkType: TickMarkType

`TickMarkType`
• locale: string

`string`
## Returns​

string | null

`string`
`null`
- ExampleParametersReturns

---

# lightweight-charts docs api functions createChartEx

createChartEx<HorzScaleItem, THorzScaleBehavior>(container, horzScaleBehavior, options?): IChartApiBase<HorzScaleItem>

`HorzScaleItem`
`THorzScaleBehavior`
`container`
`horzScaleBehavior`
`options`
`IChartApiBase`
`HorzScaleItem`
This function is the main entry point of the Lightweight Charting Library. If you are using time values
for the horizontal scale then it is recommended that you rather use the createChart function.

## Type parameters​

• HorzScaleItem

type of points on the horizontal scale

• THorzScaleBehavior extends IHorzScaleBehavior<HorzScaleItem>

`IHorzScaleBehavior`
`HorzScaleItem`
type of horizontal axis strategy that encapsulate all the specific behaviors of the horizontal scale type

## Parameters​

• container: string | HTMLElement

`string`
`HTMLElement`
ID of HTML element or element itself

• horzScaleBehavior: THorzScaleBehavior

`THorzScaleBehavior`
Horizontal scale behavior

• options?: DeepPartial<ReturnType<THorzScaleBehavior["options"]>>

`DeepPartial`
`ReturnType`
`THorzScaleBehavior`
`"options"`
Any subset of options to be applied at start.

## Returns​

IChartApiBase<HorzScaleItem>

`IChartApiBase`
`HorzScaleItem`
An interface to the created chart

- Type parametersParametersReturns

---

# lightweight-charts docs api functions createYieldCurveChart

createYieldCurveChart(container, options?): IYieldCurveChartApi

`container`
`options`
`IYieldCurveChartApi`
Creates a yield curve chart with the specified options.

A yield curve chart differs from the default chart type
in the following ways:

- Horizontal scale is linearly spaced, and defined in monthly
time duration units

- Whitespace is ignored for the crosshair and grid lines

## Parameters​

• container: string | HTMLElement

`string`
`HTMLElement`
ID of HTML element or element itself

• options?: DeepPartial <YieldCurveChartOptions>

`DeepPartial`
`YieldCurveChartOptions`
The yield chart options.

## Returns​

IYieldCurveChartApi

`IYieldCurveChartApi`
An interface to the created chart

- ParametersReturns

---

# lightweight-charts docs api functions createOptionsChart

createOptionsChart(container, options?): IChartApiBase<number>

`container`
`options`
`IChartApiBase`
`number`
Creates an 'options' chart with price values on the horizontal scale.

This function is used to create a specialized chart type where the horizontal scale
represents price values instead of time. It's particularly useful for visualizing
option chains, price distributions, or any data where price is the primary x-axis metric.

## Parameters​

• container: string | HTMLElement

`string`
`HTMLElement`
The DOM element or its id where the chart will be rendered.

• options?: DeepPartial <PriceChartOptions>

`DeepPartial`
`PriceChartOptions`
Optional configuration options for the price chart.

## Returns​

IChartApiBase<number>

`IChartApiBase`
`number`
An instance of IChartApiBase configured for price-based horizontal scaling.

- ParametersReturns

---

# lightweight-charts docs api interfaces PrimitiveHoveredItem

Data representing the currently hovered object from the Hit test.

## Properties​

### cursorStyle?​

optional cursorStyle: string

`optional`
`string`
CSS cursor style as defined here: MDN: CSS Cursor or undefined
if you want the library to use the default cursor style instead.

`undefined`
### externalId​

externalId: string

`string`
Hovered objects external ID. Can be used to identify the source item within a mouse subscriber event.

### zOrder​

zOrder: PrimitivePaneViewZOrder

`PrimitivePaneViewZOrder`
The zOrder of the hovered item.

### isBackground?​

optional isBackground: boolean

`optional`
`boolean`
Set to true if the object is rendered using drawBackground instead of draw.

`drawBackground`
`draw`
- PropertiescursorStyle?externalIdzOrderisBackground?

- cursorStyle?externalIdzOrderisBackground?

---

# lightweight-charts docs api interfaces IPrimitivePaneView

This interface represents the primitive for one of the pane of the chart (main chart area, time scale, price scale).

## Methods​

### zOrder()?​

optional zOrder(): PrimitivePaneViewZOrder

`optional`
`PrimitivePaneViewZOrder`
Defines where in the visual layer stack the renderer should be executed. Default is 'normal'.

`'normal'`
#### Returns​

PrimitivePaneViewZOrder

`PrimitivePaneViewZOrder`
the desired position in the visual layer stack.

#### See​

PrimitivePaneViewZOrder

### renderer()​

renderer(): IPrimitivePaneRenderer

`IPrimitivePaneRenderer`
This method returns a renderer - special object to draw data

#### Returns​

IPrimitivePaneRenderer

`IPrimitivePaneRenderer`
an renderer object to be used for drawing, or null if we have nothing to draw.

`null`
- MethodszOrder()?renderer()

- zOrder()?renderer()

---

# lightweight-charts docs api interfaces ISeriesPrimitiveAxisView

This interface represents a label on the price or time axis

## Methods​

### coordinate()​

coordinate(): number

`number`
The desired coordinate for the label. Note that the label will be automatically moved to prevent overlapping with other labels. If you would like the label to be drawn at the
exact coordinate under all circumstances then rather use fixedCoordinate.
For a price axis the value returned will represent the vertical distance (pixels) from the top. For a time axis the value will represent the horizontal distance from the left.

`fixedCoordinate`
#### Returns​

number

`number`
coordinate. distance from top for price axis, or distance from left for time axis.

### fixedCoordinate()?​

optional fixedCoordinate(): number

`optional`
`number`
fixed coordinate of the label. A label with a fixed coordinate value will always be drawn at the specified coordinate and will appear above any 'unfixed' labels. If you supply
a fixed coordinate then you should return a large negative number for coordinate so that the automatic placement of unfixed labels doesn't leave a blank space for this label.
For a price axis the value returned will represent the vertical distance (pixels) from the top. For a time axis the value will represent the horizontal distance from the left.

`coordinate`
#### Returns​

number

`number`
coordinate. distance from top for price axis, or distance from left for time axis.

### text()​

text(): string

`string`
#### Returns​

string

`string`
text of the label

### textColor()​

textColor(): string

`string`
#### Returns​

string

`string`
text color of the label

### backColor()​

backColor(): string

`string`
#### Returns​

string

`string`
background color of the label

### visible()?​

optional visible(): boolean

`optional`
`boolean`
#### Returns​

boolean

`boolean`
whether the label should be visible (default: true)

`true`
### tickVisible()?​

optional tickVisible(): boolean

`optional`
`boolean`
#### Returns​

boolean

`boolean`
whether the tick mark line should be visible (default: true)

`true`
- Methodscoordinate()fixedCoordinate()?text()textColor()backColor()visible()?tickVisible()?

- coordinate()fixedCoordinate()?text()textColor()backColor()visible()?tickVisible()?

---

# lightweight-charts docs api interfaces IPrimitivePaneRenderer

This interface represents rendering some element on the canvas

## Methods​

### draw()​

draw(target, utils?): void

`target`
`utils`
`void`
Method to draw main content of the element

#### Parameters​

• target: CanvasRenderingTarget2D

`CanvasRenderingTarget2D`
canvas context to draw on, refer to FancyCanvas library for more details about this class

• utils?: DrawingUtils

`DrawingUtils`
exposes drawing utilities (such as setLineStyle) from the library to plugins

#### Returns​

void

`void`
### drawBackground()?​

optional drawBackground(target, utils?): void

`optional`
`target`
`utils`
`void`
Optional method to draw the background.
Some elements could implement this method to draw on the background of the chart.
Usually this is some kind of watermarks or time areas highlighting.

#### Parameters​

• target: CanvasRenderingTarget2D

`CanvasRenderingTarget2D`
canvas context to draw on, refer FancyCanvas library for more details about this class

• utils?: DrawingUtils

`DrawingUtils`
exposes drawing utilities (such as setLineStyle) from the library to plugins

#### Returns​

void

`void`
- Methodsdraw()drawBackground()?

- draw()drawBackground()?

---

# lightweight-charts docs api type-aliases PrimitivePaneViewZOrder

PrimitivePaneViewZOrder: "bottom" | "normal" | "top"

`"bottom"`
`"normal"`
`"top"`
Defines where in the visual layer stack the renderer should be executed.

- bottom: Draw below everything except the background.

- normal: Draw at the same level as the series.

- top: Draw above everything (including the crosshair).

`bottom`
`normal`
`top`

---

# lightweight-charts docs plugins canvas-rendering-target

The renderer functions used within the plugins (both Custom Series, and Drawing
Primitives) are provided with a CanvasRenderingTarget2D interface on which the
drawing logic (using the
Browser's 2D Canvas API)
should be executed. CanvasRenderingTarget2D is provided by the
Fancy Canvas library.

`CanvasRenderingTarget2D`
`CanvasRenderingTarget2D`
The typescript definitions can be viewed here:
fancy-canvas on npmjs.com
and specifically the definition for CanvasRenderingTarget2D can be viewed
here:
canvas-rendering-target.d.ts

- fancy-canvas on npmjs.com

and specifically the definition for CanvasRenderingTarget2D can be viewed
here:
canvas-rendering-target.d.ts

`CanvasRenderingTarget2D`
- canvas-rendering-target.d.ts

## Using CanvasRenderingTarget2D​

`CanvasRenderingTarget2D`
CanvasRenderingTarget2D provides two rendering scope which you can use:

`CanvasRenderingTarget2D`
- useMediaCoordinateSpace

- useBitmapCoordinateSpace

`useMediaCoordinateSpace`
`useBitmapCoordinateSpace`
## Difference between Bitmap and Media​

Bitmap sizing represents the actual physical pixels on the device's screen,
while the media size represents the size of a pixel according to the operating
system (and browser) which is generally an integer representing the ratio of
actual physical pixels are used to render a media pixel. This integer ratio is
referred to as the device pixel ratio.

Using the bitmap sizing allows for more control over the drawn image to ensure
that the graphics are crisp and pixel perfect, however this generally means that
the code will contain a lot multiplication of coordinates by the pixel ratio. In
cases where you don't need to draw using the bitmap sizing then it is easier to
use media sizing as you don't need to worry about the devices pixel ratio.

### Bitmap Coordinate Space​

useBitmapCoordinateSpace can be used to if you would like draw using the
actual devices pixels as the coordinate sizing. The provided scope (of type
BitmapCoordinatesRenderingScope) contains readonly values for the following:

`useBitmapCoordinateSpace`
`BitmapCoordinatesRenderingScope`
- context
(CanvasRenderingContext2D).
Context which can be used for rendering.

- horizontalPixelRatio (number)

- verticalPixelRatio (number)

- bitmapSize (Size). Height and width of the canvas in bitmap dimensions.

- mediaSize (Size). Height and width of the canvas in media dimensions.

`context`
`horizontalPixelRatio`
`verticalPixelRatio`
`bitmapSize`
`mediaSize`
#### Bitmap Coordinate Space Usage​

```text
// target is an instance of CanvasRenderingTarget2Dtarget.useBitmapCoordinateSpace(scope => {    // scope is an instance of BitmapCoordinatesRenderingScope    // example of drawing a filled rectangle which fills the canvas    scope.context.beginPath();    scope.context.rect(0, 0, scope.bitmapSize.width, scope.bitmapSize.height);    scope.context.fillStyle = 'rgba(100, 200, 50, 0.5)';    scope.context.fill();});
```

### Media Coordinate Space​

useMediaCoordinateSpace can be used to if you would like draw using the media
dimensions as the coordinate sizing. The provided scope (of type
MediaCoordinatesRenderingScope) contains readonly values for the following:

`useMediaCoordinateSpace`
`MediaCoordinatesRenderingScope`
- context
(CanvasRenderingContext2D).
Context which can be used for rendering.

- mediaSize (Size). Height and width of the canvas in media dimensions.

`context`
`mediaSize`
#### Media Coordinate Space Usage​

```text
// target is an instance of CanvasRenderingTarget2Dtarget.useMediaCoordinateSpace(scope => {    // scope is an instance of BitmapCoordinatesRenderingScope    // example of drawing a filled rectangle which fills the canvas    scope.context.beginPath();    scope.context.rect(0, 0, scope.mediaSize.width, scope.mediaSize.height);    scope.context.fillStyle = 'rgba(100, 200, 50, 0.5)';    scope.context.fill();});
```

## General Tips​

It is recommended that rendering functions should save and restore the canvas
context before and after all the rendering logic to ensure that the canvas state
is the same as when the renderer function was evoked. To handle the case
when an error in the code might prevent the restore function from being evoked,
you should use the try - finally code block to ensure that the context is
correctly restored in all cases.

Note that useBitmapCoordinateSpace and useMediaCoordinateSpace will automatically
save and restore the canvas context for the logic defined within them. This tip for your
additional rendering functions within the use*CoordinateSpace.

`useBitmapCoordinateSpace`
`useMediaCoordinateSpace`
`use*CoordinateSpace`
```text
function myRenderingFunction(scope) {    const ctx = scope.context;    // save the current state of the context to the stack    ctx.save();    try {        // example code        scope.context.beginPath();        scope.context.rect(0, 0, scope.mediaSize.width, scope.mediaSize.height);        scope.context.fillStyle = 'rgba(100, 200, 50, 0.5)';        scope.context.fill();    } finally {        // restore the saved context from the stack        ctx.restore();    }}target.useMediaCoordinateSpace(scope => {    myRenderingFunction(scope);    myOtherRenderingFunction(scope);    /* ... */});
```

- Using CanvasRenderingTarget2DDifference between Bitmap and MediaBitmap Coordinate SpaceMedia Coordinate SpaceGeneral Tips

`CanvasRenderingTarget2D`
- Bitmap Coordinate SpaceMedia Coordinate Space

---

# lightweight-charts docs api interfaces IPanePrimitivePaneView

This interface represents the primitive for one of the pane of the chart (main chart area, time scale, price scale).

## Methods​

### zOrder()?​

optional zOrder(): PrimitivePaneViewZOrder

`optional`
`PrimitivePaneViewZOrder`
Defines where in the visual layer stack the renderer should be executed. Default is 'normal'.

`'normal'`
#### Returns​

PrimitivePaneViewZOrder

`PrimitivePaneViewZOrder`
the desired position in the visual layer stack.

#### See​

PrimitivePaneViewZOrder

### renderer()​

renderer(): IPrimitivePaneRenderer

`IPrimitivePaneRenderer`
This method returns a renderer - special object to draw data

#### Returns​

IPrimitivePaneRenderer

`IPrimitivePaneRenderer`
an renderer object to be used for drawing, or null if we have nothing to draw.

`null`
- MethodszOrder()?renderer()

- zOrder()?renderer()

---

# lightweight-charts docs api type-aliases HorzScalePriceItem

HorzScalePriceItem: number

`number`

---

# lightweight-charts docs api interfaces VerticalGradientColor

Represents a vertical gradient of two colors.

## Properties​

### type​

type: VerticalGradient

`VerticalGradient`
Type of color.

### topColor​

topColor: string

`string`
Top color

### bottomColor​

bottomColor: string

`string`
Bottom color

- PropertiestypetopColorbottomColor

- typetopColorbottomColor

---

# lightweight-charts docs api interfaces SolidColor

Represents a solid color.

## Properties​

### type​

type: Solid

`Solid`
Type of color.

### color​

color: string

`string`
Color.

- Propertiestypecolor

- typecolor

---

# lightweight-charts docs api type-aliases AlphaComponent

AlphaComponent: Nominal<number, "AlphaComponent">

`Nominal`
`number`
`"AlphaComponent"`
Alpha component of the RGBA color value
The valid values are integers in range [0, 1]

---

# lightweight-charts docs api type-aliases BlueComponent

BlueComponent: Nominal<number, "BlueComponent">

`Nominal`
`number`
`"BlueComponent"`
Blue component of the RGB color value
The valid values are integers in range [0, 255]

---

# lightweight-charts docs api type-aliases GreenComponent

GreenComponent: Nominal<number, "GreenComponent">

`Nominal`
`number`
`"GreenComponent"`
Green component of the RGB color value
The valid values are integers in range [0, 255]

---

# lightweight-charts docs api type-aliases RedComponent

RedComponent: Nominal<number, "RedComponent">

`Nominal`
`number`
`"RedComponent"`
Red component of the RGB color value
The valid values are integers in range [0, 255]

---

# lightweight-charts docs api enumerations TickMarkType

Represents the type of a tick mark on the time axis.

## Enumeration Members​

### Year​

Year: 0

`0`
The start of the year (e.g. it's the first tick mark in a year).

### Month​

Month: 1

`1`
The start of the month (e.g. it's the first tick mark in a month).

### DayOfMonth​

DayOfMonth: 2

`2`
A day of the month.

### Time​

Time: 3

`3`
A time without seconds.

### TimeWithSeconds​

TimeWithSeconds: 4

`4`
A time with seconds.

- Enumeration MembersYearMonthDayOfMonthTimeTimeWithSeconds

- YearMonthDayOfMonthTimeTimeWithSeconds

---

# lightweight-charts docs api interfaces IYieldCurveChartApi

The main interface of a single yield curve chart.

## Extends​

- Omit <IChartApiBase<number>, "addSeries">

`Omit`
`IChartApiBase`
`number`
`"addSeries"`
## Methods​

### remove()​

remove(): void

`void`
Removes the chart object including all DOM elements. This is an irreversible operation, you cannot do anything with the chart after removing it.

#### Returns​

void

`void`
#### Inherited from​

Omit.remove

`Omit.remove`
### resize()​

resize(width, height, forceRepaint?): void

`width`
`height`
`forceRepaint`
`void`
Sets fixed size of the chart. By default chart takes up 100% of its container.

If chart has the autoSize option enabled, and the ResizeObserver is available then
the width and height values will be ignored.

`autoSize`
#### Parameters​

• width: number

`number`
Target width of the chart.

• height: number

`number`
Target height of the chart.

• forceRepaint?: boolean

`boolean`
True to initiate resize immediately. One could need this to get screenshot immediately after resize.

#### Returns​

void

`void`
#### Inherited from​

Omit.resize

`Omit.resize`
### addCustomSeries()​

addCustomSeries<TData, TOptions, TPartialOptions>(customPaneView, customOptions?, paneIndex?): ISeriesApi<"Custom", number, WhitespaceData<number> | TData, TOptions, TPartialOptions>

`TData`
`TOptions`
`TPartialOptions`
`customPaneView`
`customOptions`
`paneIndex`
`ISeriesApi`
`"Custom"`
`number`
`WhitespaceData`
`number`
`TData`
`TOptions`
`TPartialOptions`
Creates a custom series with specified parameters.

A custom series is a generic series which can be extended with a custom renderer to
implement chart types which the library doesn't support by default.

#### Type parameters​

• TData extends CustomData<number>

`CustomData`
`number`
• TOptions extends CustomSeriesOptions

`CustomSeriesOptions`
• TPartialOptions extends DeepPartial<TOptions & SeriesOptionsCommon> = DeepPartial<TOptions & SeriesOptionsCommon>

`DeepPartial`
`TOptions`
`SeriesOptionsCommon`
`DeepPartial`
`TOptions`
`SeriesOptionsCommon`
#### Parameters​

• customPaneView: ICustomSeriesPaneView<number, TData, TOptions>

`ICustomSeriesPaneView`
`number`
`TData`
`TOptions`
A custom series pane view which implements the custom renderer.

• customOptions?: DeepPartial<TOptions & SeriesOptionsCommon>

`DeepPartial`
`TOptions`
`SeriesOptionsCommon`
Customization parameters of the series being created.

```text
const series = chart.addCustomSeries(myCustomPaneView);
```

• paneIndex?: number

`number`
#### Returns​

ISeriesApi<"Custom", number, WhitespaceData<number> | TData, TOptions, TPartialOptions>

`ISeriesApi`
`"Custom"`
`number`
`WhitespaceData`
`number`
`TData`
`TOptions`
`TPartialOptions`
#### Inherited from​

Omit.addCustomSeries

`Omit.addCustomSeries`
### removeSeries()​

removeSeries(seriesApi): void

`seriesApi`
`void`
Removes a series of any type. This is an irreversible operation, you cannot do anything with the series after removing it.

#### Parameters​

• seriesApi: ISeriesApi<keyof SeriesOptionsMap, number, WhitespaceData<number> | LineData<number> | CustomData<number> | AreaData<number> | BarData<number> | CandlestickData<number> | BaselineData<number> | HistogramData<number> | CustomSeriesWhitespaceData<number>, CustomSeriesOptions | AreaSeriesOptions | BarSeriesOptions | CandlestickSeriesOptions | BaselineSeriesOptions | LineSeriesOptions | HistogramSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon> | DeepPartial <BarStyleOptions & SeriesOptionsCommon> | DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon> | DeepPartial <BaselineStyleOptions & SeriesOptionsCommon> | DeepPartial <LineStyleOptions & SeriesOptionsCommon> | DeepPartial <HistogramStyleOptions & SeriesOptionsCommon> | DeepPartial <CustomStyleOptions & SeriesOptionsCommon>>

`ISeriesApi`
`SeriesOptionsMap`
`number`
`WhitespaceData`
`number`
`LineData`
`number`
`CustomData`
`number`
`AreaData`
`number`
`BarData`
`number`
`CandlestickData`
`number`
`BaselineData`
`number`
`HistogramData`
`number`
`CustomSeriesWhitespaceData`
`number`
`CustomSeriesOptions`
`AreaSeriesOptions`
`BarSeriesOptions`
`CandlestickSeriesOptions`
`BaselineSeriesOptions`
`LineSeriesOptions`
`HistogramSeriesOptions`
`DeepPartial`
`AreaStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`BarStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`CandlestickStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`BaselineStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`LineStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`HistogramStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`CustomStyleOptions`
`SeriesOptionsCommon`
#### Returns​

void

`void`
#### Inherited from​

Omit.removeSeries

`Omit.removeSeries`
#### Example​

```text
chart.removeSeries(series);
```

### subscribeClick()​

subscribeClick(handler): void

`handler`
`void`
Subscribe to the chart click event.

#### Parameters​

• handler: MouseEventHandler<number>

`MouseEventHandler`
`number`
Handler to be called on mouse click.

#### Returns​

void

`void`
#### Inherited from​

Omit.subscribeClick

`Omit.subscribeClick`
#### Example​

```text
function myClickHandler(param) {    if (!param.point) {        return;    }    console.log(`Click at ${param.point.x}, ${param.point.y}. The time is ${param.time}.`);}chart.subscribeClick(myClickHandler);
```

### unsubscribeClick()​

unsubscribeClick(handler): void

`handler`
`void`
Unsubscribe a handler that was previously subscribed using subscribeClick.

#### Parameters​

• handler: MouseEventHandler<number>

`MouseEventHandler`
`number`
Previously subscribed handler

#### Returns​

void

`void`
#### Inherited from​

Omit.unsubscribeClick

`Omit.unsubscribeClick`
#### Example​

```text
chart.unsubscribeClick(myClickHandler);
```

### subscribeDblClick()​

subscribeDblClick(handler): void

`handler`
`void`
Subscribe to the chart double-click event.

#### Parameters​

• handler: MouseEventHandler<number>

`MouseEventHandler`
`number`
Handler to be called on mouse double-click.

#### Returns​

void

`void`
#### Inherited from​

Omit.subscribeDblClick

`Omit.subscribeDblClick`
#### Example​

```text
function myDblClickHandler(param) {    if (!param.point) {        return;    }    console.log(`Double Click at ${param.point.x}, ${param.point.y}. The time is ${param.time}.`);}chart.subscribeDblClick(myDblClickHandler);
```

### unsubscribeDblClick()​

unsubscribeDblClick(handler): void

`handler`
`void`
Unsubscribe a handler that was previously subscribed using subscribeDblClick.

#### Parameters​

• handler: MouseEventHandler<number>

`MouseEventHandler`
`number`
Previously subscribed handler

#### Returns​

void

`void`
#### Inherited from​

Omit.unsubscribeDblClick

`Omit.unsubscribeDblClick`
#### Example​

```text
chart.unsubscribeDblClick(myDblClickHandler);
```

### subscribeCrosshairMove()​

subscribeCrosshairMove(handler): void

`handler`
`void`
Subscribe to the crosshair move event.

#### Parameters​

• handler: MouseEventHandler<number>

`MouseEventHandler`
`number`
Handler to be called on crosshair move.

#### Returns​

void

`void`
#### Inherited from​

Omit.subscribeCrosshairMove

`Omit.subscribeCrosshairMove`
#### Example​

```text
function myCrosshairMoveHandler(param) {    if (!param.point) {        return;    }    console.log(`Crosshair moved to ${param.point.x}, ${param.point.y}. The time is ${param.time}.`);}chart.subscribeCrosshairMove(myCrosshairMoveHandler);
```

### unsubscribeCrosshairMove()​

unsubscribeCrosshairMove(handler): void

`handler`
`void`
Unsubscribe a handler that was previously subscribed using subscribeCrosshairMove.

#### Parameters​

• handler: MouseEventHandler<number>

`MouseEventHandler`
`number`
Previously subscribed handler

#### Returns​

void

`void`
#### Inherited from​

Omit.unsubscribeCrosshairMove

`Omit.unsubscribeCrosshairMove`
#### Example​

```text
chart.unsubscribeCrosshairMove(myCrosshairMoveHandler);
```

### priceScale()​

priceScale(priceScaleId, paneIndex?): IPriceScaleApi

`priceScaleId`
`paneIndex`
`IPriceScaleApi`
Returns API to manipulate a price scale.

#### Parameters​

• priceScaleId: string

`string`
ID of the price scale.

• paneIndex?: number

`number`
Index of the pane (default: 0)

#### Returns​

IPriceScaleApi

`IPriceScaleApi`
Price scale API.

#### Inherited from​

Omit.priceScale

`Omit.priceScale`
### timeScale()​

timeScale(): ITimeScaleApi<number>

`ITimeScaleApi`
`number`
Returns API to manipulate the time scale

#### Returns​

ITimeScaleApi<number>

`ITimeScaleApi`
`number`
Target API

#### Inherited from​

Omit.timeScale

`Omit.timeScale`
### applyOptions()​

applyOptions(options): void

`options`
`void`
Applies new options to the chart

#### Parameters​

• options: DeepPartial <ChartOptionsImpl<number>>

`DeepPartial`
`ChartOptionsImpl`
`number`
Any subset of options.

#### Returns​

void

`void`
#### Inherited from​

Omit.applyOptions

`Omit.applyOptions`
### options()​

options(): Readonly <ChartOptionsImpl<number>>

`Readonly`
`ChartOptionsImpl`
`number`
Returns currently applied options

#### Returns​

Readonly <ChartOptionsImpl<number>>

`Readonly`
`ChartOptionsImpl`
`number`
Full set of currently applied options, including defaults

#### Inherited from​

Omit.options

`Omit.options`
### takeScreenshot()​

takeScreenshot(addTopLayer?, includeCrosshair?): HTMLCanvasElement

`addTopLayer`
`includeCrosshair`
`HTMLCanvasElement`
Make a screenshot of the chart with all the elements excluding crosshair.

#### Parameters​

• addTopLayer?: boolean

`boolean`
if true, the top layer and primitives will be included in the screenshot (default: false)

• includeCrosshair?: boolean

`boolean`
works only if addTopLayer is enabled. If true, the crosshair will be included in the screenshot (default: false)

#### Returns​

HTMLCanvasElement

`HTMLCanvasElement`
A canvas with the chart drawn on. Any Canvas methods like toDataURL() or toBlob() can be used to serialize the result.

`Canvas`
`toDataURL()`
`toBlob()`
#### Inherited from​

Omit.takeScreenshot

`Omit.takeScreenshot`
### addPane()​

addPane(preserveEmptyPane?): IPaneApi<number>

`preserveEmptyPane`
`IPaneApi`
`number`
Add a pane to the chart

#### Parameters​

• preserveEmptyPane?: boolean

`boolean`
Whether to preserve the empty pane

#### Returns​

IPaneApi<number>

`IPaneApi`
`number`
The pane API

#### Inherited from​

Omit.addPane

`Omit.addPane`
### panes()​

panes(): IPaneApi<number>[]

`IPaneApi`
`number`
Returns array of panes' API

#### Returns​

IPaneApi<number>[]

`IPaneApi`
`number`
array of pane's Api

#### Inherited from​

Omit.panes

`Omit.panes`
### removePane()​

removePane(index): void

`index`
`void`
Removes a pane with index

#### Parameters​

• index: number

`number`
the pane to be removed

#### Returns​

void

`void`
#### Inherited from​

Omit.removePane

`Omit.removePane`
### swapPanes()​

swapPanes(first, second): void

`first`
`second`
`void`
swap the position of two panes.

#### Parameters​

• first: number

`number`
the first index

• second: number

`number`
the second index

#### Returns​

void

`void`
#### Inherited from​

Omit.swapPanes

`Omit.swapPanes`
### autoSizeActive()​

autoSizeActive(): boolean

`boolean`
Returns the active state of the autoSize option. This can be used to check
whether the chart is handling resizing automatically with a ResizeObserver.

`autoSize`
`ResizeObserver`
#### Returns​

boolean

`boolean`
Whether the autoSize option is enabled and the active.

`autoSize`
#### Inherited from​

Omit.autoSizeActive

`Omit.autoSizeActive`
### chartElement()​

chartElement(): HTMLDivElement

`HTMLDivElement`
Returns the generated div element containing the chart. This can be used for adding your own additional event listeners, or for measuring the
elements dimensions and position within the document.

#### Returns​

HTMLDivElement

`HTMLDivElement`
generated div element containing the chart.

#### Inherited from​

Omit.chartElement

`Omit.chartElement`
### setCrosshairPosition()​

setCrosshairPosition(price, horizontalPosition, seriesApi): void

`price`
`horizontalPosition`
`seriesApi`
`void`
Set the crosshair position within the chart.

Usually the crosshair position is set automatically by the user's actions. However in some cases you may want to set it explicitly.

For example if you want to synchronise the crosshairs of two separate charts.

#### Parameters​

• price: number

`number`
The price (vertical coordinate) of the new crosshair position.

• horizontalPosition: number

`number`
The horizontal coordinate (time by default) of the new crosshair position.

• seriesApi: ISeriesApi<keyof SeriesOptionsMap, number, WhitespaceData<number> | LineData<number> | CustomData<number> | AreaData<number> | BarData<number> | CandlestickData<number> | BaselineData<number> | HistogramData<number> | CustomSeriesWhitespaceData<number>, CustomSeriesOptions | AreaSeriesOptions | BarSeriesOptions | CandlestickSeriesOptions | BaselineSeriesOptions | LineSeriesOptions | HistogramSeriesOptions, DeepPartial <AreaStyleOptions & SeriesOptionsCommon> | DeepPartial <BarStyleOptions & SeriesOptionsCommon> | DeepPartial <CandlestickStyleOptions & SeriesOptionsCommon> | DeepPartial <BaselineStyleOptions & SeriesOptionsCommon> | DeepPartial <LineStyleOptions & SeriesOptionsCommon> | DeepPartial <HistogramStyleOptions & SeriesOptionsCommon> | DeepPartial <CustomStyleOptions & SeriesOptionsCommon>>

`ISeriesApi`
`SeriesOptionsMap`
`number`
`WhitespaceData`
`number`
`LineData`
`number`
`CustomData`
`number`
`AreaData`
`number`
`BarData`
`number`
`CandlestickData`
`number`
`BaselineData`
`number`
`HistogramData`
`number`
`CustomSeriesWhitespaceData`
`number`
`CustomSeriesOptions`
`AreaSeriesOptions`
`BarSeriesOptions`
`CandlestickSeriesOptions`
`BaselineSeriesOptions`
`LineSeriesOptions`
`HistogramSeriesOptions`
`DeepPartial`
`AreaStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`BarStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`CandlestickStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`BaselineStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`LineStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`HistogramStyleOptions`
`SeriesOptionsCommon`
`DeepPartial`
`CustomStyleOptions`
`SeriesOptionsCommon`
#### Returns​

void

`void`
#### Inherited from​

Omit.setCrosshairPosition

`Omit.setCrosshairPosition`
### clearCrosshairPosition()​

clearCrosshairPosition(): void

`void`
Clear the crosshair position within the chart.

#### Returns​

void

`void`
#### Inherited from​

Omit.clearCrosshairPosition

`Omit.clearCrosshairPosition`
### paneSize()​

paneSize(paneIndex?): PaneSize

`paneIndex`
`PaneSize`
Returns the dimensions of the chart pane (the plot surface which excludes time and price scales).
This would typically only be useful for plugin development.

#### Parameters​

• paneIndex?: number

`number`
The index of the pane

#### Returns​

PaneSize

`PaneSize`
Dimensions of the chart pane

#### Inherited from​

Omit.paneSize

`Omit.paneSize`
#### Default Value​

0

`0`
### horzBehaviour()​

horzBehaviour(): IHorzScaleBehavior<number>

`IHorzScaleBehavior`
`number`
Returns the horizontal scale behaviour.

#### Returns​

IHorzScaleBehavior<number>

`IHorzScaleBehavior`
`number`
#### Inherited from​

Omit.horzBehaviour

`Omit.horzBehaviour`
### addSeries()​

addSeries<T>(definition, options?, paneIndex?): ISeriesApi<T, number, WhitespaceData<number> | LineData<number>, SeriesOptionsMap[T], SeriesPartialOptionsMap[T]>

`T`
`definition`
`options`
`paneIndex`
`ISeriesApi`
`T`
`number`
`WhitespaceData`
`number`
`LineData`
`number`
`SeriesOptionsMap`
`T`
`SeriesPartialOptionsMap`
`T`
Creates a series with specified parameters.

Note that the Yield Curve chart only supports the Area and Line series types.

#### Type parameters​

• T extends YieldCurveSeriesType

`YieldCurveSeriesType`
#### Parameters​

• definition: SeriesDefinition<T>

`SeriesDefinition`
`T`
A series definition for either AreaSeries or LineSeries.

• options?: SeriesPartialOptionsMap[T]

`SeriesPartialOptionsMap`
`T`
Customization parameters of the series being created.

• paneIndex?: number

`number`
An index of the pane where the series should be created.

```text
const series = chart.addSeries(LineSeries, { lineWidth: 2 });
```

#### Returns​

ISeriesApi<T, number, WhitespaceData<number> | LineData<number>, SeriesOptionsMap[T], SeriesPartialOptionsMap[T]>

`ISeriesApi`
`T`
`number`
`WhitespaceData`
`number`
`LineData`
`number`
`SeriesOptionsMap`
`T`
`SeriesPartialOptionsMap`
`T`
- ExtendsMethodsremove()resize()addCustomSeries()removeSeries()subscribeClick()unsubscribeClick()subscribeDblClick()unsubscribeDblClick()subscribeCrosshairMove()unsubscribeCrosshairMove()priceScale()timeScale()applyOptions()options()takeScreenshot()addPane()panes()removePane()swapPanes()autoSizeActive()chartElement()setCrosshairPosition()clearCrosshairPosition()paneSize()horzBehaviour()addSeries()

- remove()resize()addCustomSeries()removeSeries()subscribeClick()unsubscribeClick()subscribeDblClick()unsubscribeDblClick()subscribeCrosshairMove()unsubscribeCrosshairMove()priceScale()timeScale()applyOptions()options()takeScreenshot()addPane()panes()removePane()swapPanes()autoSizeActive()chartElement()setCrosshairPosition()clearCrosshairPosition()paneSize()horzBehaviour()addSeries()

---

# lightweight-charts docs api interfaces DrawingUtils

Helper drawing utilities exposed by the library to a Primitive (a.k.a plugin).

## Properties​

### setLineStyle()​

readonly setLineStyle: (ctx, lineStyle) => void

`readonly`
`ctx`
`lineStyle`
`void`
Drawing utility to change the line style on the canvas context to one of the
built-in line styles.

#### Parameters​

• ctx: CanvasRenderingContext2D

`CanvasRenderingContext2D`
2D rendering context for the target canvas.

• lineStyle: LineStyle

`LineStyle`
Built-in LineStyle to set on the canvas context.

#### Returns​

void

`void`
- PropertiessetLineStyle()

- setLineStyle()

---

# lightweight-charts docs api enumerations ColorType

Represents a type of color.

## Enumeration Members​

### Solid​

Solid: "solid"

`"solid"`
Solid color

### VerticalGradient​

VerticalGradient: "gradient"

`"gradient"`
Vertical gradient color

- Enumeration MembersSolidVerticalGradient

- SolidVerticalGradient

---

# lightweight-charts docs api type-aliases YieldCurveSeriesType

YieldCurveSeriesType: "Area" | "Line"

`"Area"`
`"Line"`

---

