import { Component, OnInit } from '@angular/core';

import * as d3 from 'd3-selection';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import * as d3Axis from 'd3-axis';
import * as d3Zoom from 'd3-zoom';
import * as d3Brush from 'd3-brush';
import * as d3Array from 'd3-array';
import * as d3TimeFormat from 'd3-time-format';

import { ChemicalLevel } from './shared/data';

export interface Margin {
    top: number;
    right: number;
    bottom: number;
    left: number;
}

interface Stock {
    date: Date;
    value: number;
}

@Component({
    selector: 'app-root',
    template: `
    <h1>{{title}}</h1>
    <svg width="550" height="400"></svg>
  `
})
export class AppComponent implements OnInit {

    title: string = 'Multi-Line Brush & Zoom!';

    private margin: Margin;
    private width: number;
    private height: number;

    private svg: any;

    private x: any;
    private x2: any;
    private y: any;

    private xAxis: any;
    private yAxis: any;

    private context: any;
    private brush: any;
    private zoom: any;
    private area: any;
    private focus: any;

    private parseDate = d3TimeFormat.timeParse('%Y-%m-%dT%H:%M:%SZ');

    private parseDataPH(data: any[]): Stock[] {
        return data.map(v => <Stock>{ date: this.parseDate(v.date), value: v.value });
    }

    private parseDataPPM(data: any[]): Stock[] {
        return data.map(v => <Stock>{ date: this.parseDate(v.date), value: v.value1 });
    }

    constructor() {
    }

    ngOnInit() {
        this.initMargins();
        this.initSvg();
        this.drawChart(this.parseDataPH(ChemicalLevel), 'blue');
        this.drawChart(this.parseDataPPM(ChemicalLevel), 'red')
    }

    private initMargins() {
        this.margin = { top: 20, right: 20, bottom: 110, left: 40 };
    }

    private initSvg() {
        this.svg = d3.select('svg');

        this.width = +this.svg.attr('width') - this.margin.left - this.margin.right;
        this.height = +this.svg.attr('height') - this.margin.top - this.margin.bottom;

        this.x = d3Scale.scaleTime().range([0, this.width]);
        this.x2 = d3Scale.scaleTime().range([0, this.width]);
        this.y = d3Scale.scaleLinear().range([this.height, 0]);                   

        this.xAxis = d3Axis.axisBottom(this.x);
        this.yAxis = d3Axis.axisLeft(this.y);

        this.brush = d3Brush.brushX()
            .extent([[0, 0], [this.width, this.height]])
            .on('brush end', this.brushed.bind(this));

        this.zoom = d3Zoom.zoom()
            .scaleExtent([1, Infinity])
            .translateExtent([[0, 0], [this.width, this.height]])
            .extent([[0, 0], [this.width, this.height]])
            .on('zoom', this.zoomed.bind(this));

        this.area = d3Shape.area()
            .curve(d3Shape.curveMonotoneX)
            .x((d: any) => this.x(d.date))
            .y((d: any) => this.y(d.value));

        this.svg.append('defs').append('clipPath')
            .attr('id', 'clip')
            .append('rect')            
            .attr('width', this.width)
            .attr('height', this.height);

        this.focus = this.svg.append('g')
            .attr('class', 'focus')
            .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

        this.context = this.svg.append('g')
            .attr('class', 'context')
            .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');
    }
        
    private brushed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return;
        let s = d3.event.selection || this.x2.range();
        this.x.domain(s.map(this.x2.invert, this.x2));
        this.focus.selectAll('.area').attr('d', this.area);
        this.focus.selectAll('.axis--x').call(this.xAxis);
        this.svg.selectAll('.zoom').call(this.zoom.transform, d3Zoom.zoomIdentity
            .scale(this.width / (s[1] - s[0]))
            .translate(-s[0], 0));
    }

    private zoomed() {
        if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'brush') return;
        let t = d3.event.transform;
        this.x.domain(t.rescaleX(this.x2).domain());
        this.focus.selectAll('.area').attr('d', this.area);
        this.focus.selectAll('.axis--x').call(this.xAxis);
        this.context.selectAll('.brush').call(this.brush.move, this.x.range().map(t.invertX, t));
    }

    private drawChart(data: Stock[], color: any) {

        this.x.domain(d3Array.extent(data, (d: Stock) => d.date));
        this.y.domain([0, d3Array.max(data, (d: Stock) => d.value)]);
        this.x2.domain(this.x.domain());

        this.focus.append('path')
            .datum(data)
            .attr('class', 'area')
            .attr('d', this.area)
            .attr('stroke', color);

        this.focus.append('g')
            .attr('class', 'axis axis--x')
            .attr('transform', 'translate(0,' + this.height + ')')
            .call(this.xAxis)
            .append("text")
            .attr("x", 908)
            .attr("fill", "#000")
            .text("Time");

        this.focus.append('g')
            .attr('class', 'axis axis--y')
            .call(this.yAxis)
            .append("text")
            .attr("y", -10)
            .attr("fill", "#000")
            .text("PH/PPM");

        this.svg.append('rect')
            .attr('class', 'zoom')
            .attr('width', this.width)
            .attr('height', this.height)            
            .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
            .call(this.zoom);
    }

}
