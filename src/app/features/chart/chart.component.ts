import { Component, ElementRef, ViewChild, AfterViewInit, OnDestroy, Input, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { createChart, IChartApi, ISeriesApi } from 'lightweight-charts';
import { MarketDataService } from '../../core/services';

@Component({
  selector: 'app-chart',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="surface-card p-4 h-full flex flex-col">
      <!-- Header -->
      <div class="flex items-center justify-between mb-4">
        <div>
          <h3 class="font-semibold text-lg">{{ symbol() }}</h3>
          <div class="flex items-center gap-2 text-sm">
            <span class="font-mono">{{ currentPrice() | number:'1.2-2' }}</span>
            <span 
              [class.text-kite-green]="priceChange() >= 0"
              [class.text-kite-red]="priceChange() < 0"
            >
              {{ priceChange() >= 0 ? '+' : '' }}{{ priceChange() | number:'1.2-2' }}%
            </span>
          </div>
        </div>
        
        <!-- Timeframe Selector -->
        <div class="toggle-group">
          @for (tf of timeframes; track tf.value) {
            <button 
              (click)="setTimeframe(tf.value)"
              class="toggle-item"
              [class.active]="selectedTimeframe() === tf.value"
            >
              {{ tf.label }}
            </button>
          }
        </div>
      </div>

      <!-- Chart Container -->
      <div #chartContainer class="flex-1 min-h-[400px]"></div>

      <!-- Indicators -->
      <div class="flex items-center gap-2 mt-2 text-xs">
        <span class="text-[var(--kite-text-muted)]">Indicators:</span>
        @for (ind of indicators; track ind.id) {
          <button 
            (click)="toggleIndicator(ind.id)"
            class="px-2 py-1 rounded border transition-colors"
            [class.bg-kite-accent]="activeIndicators().includes(ind.id)"
            [class.text-white]="activeIndicators().includes(ind.id)"
            [class.border-kite-accent]="activeIndicators().includes(ind.id)"
          >
            {{ ind.label }}
          </button>
        }
      </div>
    </div>
  `
})
export class ChartComponent implements AfterViewInit, OnDestroy {
  @ViewChild('chartContainer') chartContainer!: ElementRef;
  @Input() set symbolInput(value: string) {
    this.symbol.set(value);
    if (this.chart) {
      this.loadData();
    }
  }

  private marketDataService = inject(MarketDataService);

  symbol = signal('RELIANCE');
  currentPrice = signal(2456.75);
  priceChange = signal(0.96);
  selectedTimeframe = signal('1D');
  activeIndicators = signal<string[]>(['MA']);

  private chart: IChartApi | null = null;
  private candlestickSeries: ISeriesApi<'Candlestick'> | null = null;
  private volumeSeries: ISeriesApi<'Histogram'> | null = null;
  private resizeObserver: ResizeObserver | null = null;

  timeframes = [
    { value: '1m', label: '1m' },
    { value: '5m', label: '5m' },
    { value: '15m', label: '15m' },
    { value: '1h', label: '1H' },
    { value: '1D', label: '1D' },
  ];

  indicators = [
    { id: 'MA', label: 'MA' },
    { id: 'RSI', label: 'RSI' },
    { id: 'MACD', label: 'MACD' },
  ];

  ngAfterViewInit(): void {
    this.initChart();
    this.loadData();
  }

  ngOnDestroy(): void {
    this.resizeObserver?.disconnect();
    this.chart?.remove();
  }

  private initChart(): void {
    const container = this.chartContainer.nativeElement;

    this.chart = createChart(container, {
      layout: {
        background: { color: 'transparent' },
        textColor: '#9e9e9e',
      },
      grid: {
        vertLines: { color: '#2c2c2c' },
        horzLines: { color: '#2c2c2c' },
      },
      crosshair: {
        mode: 1,
      },
      rightPriceScale: {
        borderColor: '#2c2c2c',
      },
      timeScale: {
        borderColor: '#2c2c2c',
        timeVisible: true,
        secondsVisible: false,
      },
      width: container.clientWidth,
      height: container.clientHeight,
    });

    this.candlestickSeries = this.chart.addCandlestickSeries({
      upColor: '#4caf50',
      downColor: '#f44336',
      borderUpColor: '#4caf50',
      borderDownColor: '#f44336',
      wickUpColor: '#4caf50',
      wickDownColor: '#f44336',
    });

    this.volumeSeries = this.chart.addHistogramSeries({
      color: '#2196f3',
      priceFormat: {
        type: 'volume',
      },
      priceScaleId: '',
    });

    this.volumeSeries.priceScale().applyOptions({
      scaleMargins: {
        top: 0.8,
        bottom: 0,
      },
    });

    // Handle resize
    this.resizeObserver = new ResizeObserver((entries: ResizeObserverEntry[]) => {
      if (entries.length > 0) {
        const { width, height } = entries[0].contentRect;
        this.chart?.applyOptions({
          width: width,
          height: height,
        });
      }
    });
    this.resizeObserver.observe(container);
  }

  private loadData(): void {
    const ohlcData = this.marketDataService.generateOHLCData(this.symbol(), 100);

    if (ohlcData.length > 0) {
      const candleData = ohlcData.map((d: any) => ({
        time: d.time,
        open: d.open,
        high: d.high,
        low: d.low,
        close: d.close,
      }));

      const volumeData = ohlcData.map((d: any) => ({
        time: d.time,
        value: d.volume,
        color: d.close >= d.open ? 'rgba(76, 175, 80, 0.5)' : 'rgba(244, 67, 54, 0.5)',
      }));

      this.candlestickSeries?.setData(candleData as any);
      this.volumeSeries?.setData(volumeData as any);

      // Update current price
      const lastCandle = ohlcData[ohlcData.length - 1];
      this.currentPrice.set(lastCandle.close);
      this.priceChange.set(((lastCandle.close - lastCandle.open) / lastCandle.open) * 100);
    }
  }

  setTimeframe(tf: string): void {
    this.selectedTimeframe.set(tf);
    this.loadData(); // Reload with new timeframe
  }

  toggleIndicator(id: string): void {
    this.activeIndicators.update(indicators => {
      if (indicators.includes(id)) {
        return indicators.filter(i => i !== id);
      }
      return [...indicators, id];
    });
    // TODO: Add/remove indicator overlays
  }
}
