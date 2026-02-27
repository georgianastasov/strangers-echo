import { Component, OnInit, inject, OnDestroy, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Firestore, doc, onSnapshot } from '@angular/fire/firestore';
import { CommonModule } from '@angular/common';
import {
  NgApexchartsModule,
  ApexAxisChartSeries,
  ApexNonAxisChartSeries,
  ApexChart,
  ApexXAxis,
  ApexTheme,
  ApexDataLabels,
  ApexFill,
  ApexYAxis,
  ApexStroke,
  ApexTooltip,
  ApexGrid,
  ApexPlotOptions,
} from 'ng-apexcharts';
import * as L from 'leaflet';

export type LineChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  stroke: ApexStroke;
  theme: ApexTheme;
  fill: ApexFill;
  tooltip: ApexTooltip;
  grid: ApexGrid;
  dataLabels: ApexDataLabels;
  colors: string[];
};

export type BarChartOptions = {
  series: ApexAxisChartSeries;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  theme: ApexTheme;
  fill: ApexFill;
  dataLabels: ApexDataLabels;
  tooltip: ApexTooltip;
  grid: ApexGrid;
  colors: string[];
  plotOptions: ApexPlotOptions;
};

export type DonutChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  theme: ApexTheme;
  dataLabels: ApexDataLabels;
  stroke: ApexStroke;
  tooltip: ApexTooltip;
  colors: string[];
  plotOptions: ApexPlotOptions;
};

@Component({
  selector: 'app-stats',
  standalone: true,
  imports: [CommonModule, NgApexchartsModule],
  templateUrl: './stats.html',
  styleUrls: ['./stats.css'],
})
export class StatsComponent implements OnInit, OnDestroy {
  public totalTracked = signal(0);
  public lastHour = signal(0);
  public last24h = signal(0);
  public recentWhispers = signal<any[]>([]);
  public chartsReady = signal(false);

  public topCities: { name: string; count: number }[] = [];
  public timelineChartOptions!: Partial<LineChartOptions>;
  public countryChartOptions!: Partial<BarChartOptions>;
  public cityChartOptions!: Partial<BarChartOptions>;
  public timeOfDayOptions!: Partial<DonutChartOptions>;

  private firestore: Firestore = inject(Firestore);
  private unsubscribe: any;
  private map: L.Map | undefined;
  private markersLayer: L.LayerGroup | undefined;

  constructor(private router: Router) {
    this.initEmptyCharts();
  }

  public ngOnInit() {
    const docRef = doc(this.firestore, 'global_stats', 'data');

    this.unsubscribe = onSnapshot(docRef, (docSnap) => {
      if (!docSnap.exists()) return;

      const data = docSnap.data();
      const now = Date.now();
      const oneHourAgo = now - 60 * 60 * 1000;

      this.totalTracked.set(data['totalTracked'] || 0);

      const timestamps = data['recentTimestamps'] || [];
      this.last24h.set(timestamps.length);
      this.lastHour.set(timestamps.filter((t: number) => t > oneHourAgo).length);

      this.recentWhispers.set(data['recentWhispers'] || []);

      const cityCounts = data['cities'] || {};
      this.topCities = Object.entries(cityCounts)
        .map(([name, count]) => ({ name, count: Number(count) }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      this.processChartData(
        data['dates'] || {},
        data['countries'] || {},
        data['times'] || [0, 0, 0, 0],
      );

      this.chartsReady.set(true);

      setTimeout(() => {
        if (!this.map) {
          this.initMap();
        }

        let latestKey: string | null = null;
        const currentWhispers = this.recentWhispers();
        if (currentWhispers.length > 0) {
          const latest = currentWhispers[0];
          if (now - latest.timestamp < 5000 && latest.lat !== null && latest.lon !== null) {
            latestKey = `${latest.lat}_${latest.lon}`;
          }
        }

        const mapData = data['mapData'] || {};
        const locationMap = new Map();
        Object.keys(mapData).forEach((k) => locationMap.set(k, mapData[k]));

        this.updateMap(locationMap, latestKey);
      }, 100);
    });
  }

  public initMap() {
    if (typeof window === 'undefined') return;

    this.map = L.map('echo-map', {
      center: [20, 0],
      zoom: 2,
      zoomControl: true,
      attributionControl: false,
    });

    L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
      maxZoom: 19,
    }).addTo(this.map);

    this.markersLayer = L.layerGroup().addTo(this.map);

    setTimeout(() => {
      this.map?.invalidateSize();
    }, 300);
  }

  public updateMap(locationMap: Map<string, any>, latestKey: string | null) {
    if (!this.markersLayer) return;
    this.markersLayer.clearLayers();

    locationMap.forEach((loc, key) => {
      const radius = Math.min(18, 4 + loc.count * 1.2);
      const isLatest = key === latestKey;

      const circle = L.circleMarker([loc.lat, loc.lon], {
        radius: radius,
        color: isLatest ? '#ffffff' : '#ff0000',
        fillColor: '#ff0000',
        fillOpacity: isLatest ? 0.9 : 0.5,
        weight: isLatest ? 3 : 1.5,
        className: isLatest ? 'live-pulse-marker' : '',
      });

      circle.bindTooltip(
        `<div style="text-align:center;">
           <span style="color:#ffcccc; font-size:0.9rem;">${loc.name}</span><br/>
           <b style="color:#ff4d4d; font-size:1.1rem;">${loc.count}</b> whispers
         </div>`,
        {
          className: 'custom-map-tooltip',
          direction: 'top',
        },
      );

      circle.addTo(this.markersLayer!);
    });
  }

  public processChartData(
    dateCounts: Record<string, number>,
    countryCounts: Record<string, number>,
    timeDistribution: number[],
  ) {
    const allDates = Object.keys(dateCounts);
    const sortedDates = allDates.slice(-7);
    const timelineData = sortedDates.map((date) => dateCounts[date]);

    this.timelineChartOptions.series = [{ name: 'Whispers', data: timelineData }];
    this.timelineChartOptions.xaxis = {
      ...this.timelineChartOptions.xaxis,
      categories: sortedDates,
    };

    const topCountries = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    this.countryChartOptions.series = [{ name: 'Clicks', data: topCountries.map((c) => c[1]) }];
    this.countryChartOptions.xaxis = {
      ...this.countryChartOptions.xaxis,
      categories: topCountries.map((c) => c[0]),
    };

    this.cityChartOptions.series = [{ name: 'Clicks', data: this.topCities.map((c) => c.count) }];
    this.cityChartOptions.xaxis = {
      ...this.cityChartOptions.xaxis,
      categories: this.topCities.map((c) => c.name),
    };

    this.timeOfDayOptions.series = timeDistribution;
  }

  public initEmptyCharts() {
    this.timelineChartOptions = {
      series: [],
      chart: {
        type: 'area',
        height: 250,
        toolbar: { show: false },
        background: 'transparent',
        animations: { enabled: true, speed: 800 },
      },
      theme: { mode: 'dark' },
      colors: ['#ff0000'],
      fill: {
        type: 'gradient',
        gradient: { shadeIntensity: 1, opacityFrom: 0.5, opacityTo: 0.05, stops: [0, 100] },
      },
      dataLabels: { enabled: false },
      stroke: { curve: 'smooth', width: 3 },
      xaxis: {
        categories: [],
        labels: { style: { colors: '#a3a3a3' } },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      grid: { borderColor: 'rgba(255,255,255,0.05)', strokeDashArray: 4 },
      tooltip: { theme: 'dark' },
    };

    this.countryChartOptions = {
      series: [],
      chart: { type: 'bar', height: 260, toolbar: { show: false }, background: 'transparent' },
      theme: { mode: 'dark' },
      colors: ['#ff3333'],
      plotOptions: { bar: { horizontal: false, borderRadius: 4, columnWidth: '60%' } } as any,
      dataLabels: { enabled: true, style: { colors: ['#fff'] } },
      xaxis: {
        categories: [],
        labels: { show: false },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { labels: { style: { colors: '#ffcccc', fontSize: '13px', fontWeight: 600 } } },
      grid: { show: false },
      tooltip: { theme: 'dark' },
    };

    this.cityChartOptions = {
      series: [],
      chart: { type: 'bar', height: 260, toolbar: { show: false }, background: 'transparent' },
      theme: { mode: 'dark' },
      colors: ['#ff4d4d'],
      plotOptions: { bar: { horizontal: false, borderRadius: 4, columnWidth: '60%' } } as any,
      dataLabels: { enabled: true, style: { colors: ['#fff'] } },
      xaxis: {
        categories: [],
        labels: { show: false },
        axisBorder: { show: false },
        axisTicks: { show: false },
      },
      yaxis: { labels: { style: { colors: '#ffcccc', fontSize: '13px', fontWeight: 600 } } },
      grid: { show: false },
      tooltip: { theme: 'dark' },
    };

    this.timeOfDayOptions = {
      series: [],
      chart: { type: 'donut', height: 260, background: 'transparent' },
      labels: ['Night (00-06)', 'Morning (06-12)', 'Afternoon (12-18)', 'Evening (18-24)'],
      theme: { mode: 'dark' },
      colors: ['#330000', '#ff0000', '#ff6666', '#990000'],
      stroke: { show: true, colors: ['#0a0000'], width: 2 },
      dataLabels: { enabled: false },
      plotOptions: { pie: { donut: { size: '75%' } } },
      tooltip: { theme: 'dark' },
    };
  }

  public ngOnDestroy() {
    if (this.unsubscribe) {
      this.unsubscribe();
    }
    if (this.map) {
      this.map.remove();
    }
  }

  public goBack() {
    this.router.navigate(['/']);
  }
}
