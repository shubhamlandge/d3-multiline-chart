import { Component, OnInit, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as d3 from 'd3-selection';
import * as d3Scale from 'd3-scale';
import * as d3Shape from 'd3-shape';
import * as d3Axis from 'd3-axis';
import * as d3Zoom from 'd3-zoom';
import * as d3Brush from 'd3-brush';
import * as d3Array from 'd3-array';
import * as d3TimeFormat from 'd3-time-format';

// import { PH, PPM, ChemicalLevel } from '../../../shared/data/monitoring.data';

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
  selector: 'app-line-chart',
  templateUrl: './line-chart.component.html',
  styleUrls: ['./line-chart.component.css']
})
export class LineChartComponent implements OnInit, OnChanges {

  //change********
  legend: boolean = true;
  colors: any;

  private margin: Margin;
 // private margin2: Margin;

  private width: number;
  private height: number;
 // private height2: number;

  private svg: any;     // TODO replace all `any` by the right type

  private x: any;
  private x2: any;
  private y: any;
 // private y2: any;

 // private z: any;

  private xAxis: any;
  //private xAxis2: any;
  private yAxis: any;

  private context: any;
  private brush: any;
  private zoom: any;
  private area: any;
  //private area2: any;
  //private area3: any;
  private focus: any;

  private parseDate = d3TimeFormat.timeParse('%Y-%m-%dT%H:%M:%S.%LZ');

  @Input() monitoringData: any;
  @Input() category: any;

  constructor() {
  }

  ngOnInit() {
    this.initMargins();
    this.initSvg();
    //change********
    this.getLegend(this.legend);
    console.log('category :', this.category);
    switch (this.category.type) {
      case 'single':
        this.drawChart(this.parseData(this.monitoringData), 'blue');
        break;
      case 'double':
        {
          this.drawChart(this.parseDataPH(this.monitoringData), 'blue');
          this.drawChart(this.parseDataPPM(this.monitoringData), 'red')
        }
        break;
      default:
        this.drawChart(this.parseData(this.monitoringData), 'blue');
    }
    // this.drawChart(this.parseData(this.monitoringData), 'blue');
    // this.drawChart(this.parseDataPH(ChemicalLevel), 'blue');
    // this.drawChart(this.parseDataPPM(ChemicalLevel), 'red')

  }

  clearPath() {
    d3.selectAll("#monitor-chart > *").remove();
  }

  ngOnChanges(changes: SimpleChanges) {
    console.log('category :', this.category);
    console.log('monitoringData :', this.monitoringData);
    if (changes['monitoringData']) {
      console.log('monitoringData Changed')
      if (this.monitoringData.length > 0) {

        this.clearPath();
        this.initMargins();
        this.initSvg();
        //change********
        this.getLegend(this.legend);
        console.log('category :', this.category);
        switch (this.category.type) {
          case 'single':
            this.drawChart(this.parseData(this.monitoringData), 'blue');
            break;
          case 'double':
            {
              this.drawChart(this.parseDataPH(this.monitoringData), 'blue');
              this.drawChart(this.parseDataPPM(this.monitoringData), 'red');
            }
            break;
          default:
            this.drawChart(this.parseData(this.monitoringData), 'blue');
        }

      }

    }
  }

  private initMargins() {
    //change********
    this.margin = { top: 5, right: 5, bottom: 30, left: 15 };
   // this.margin2 = { top: 200, right: 20, bottom: 30, left: 40 };
  }

  private parseData(data: any[]): Stock[] {
    return data.map(v => <Stock>{ date: this.parseDate(v.date), value: v.value });
  }

  private parseDataPH(data: any[]): Stock[] {
    return data.map(v => <Stock>{ date: this.parseDate(v.date), value: v.value });
  }

  private parseDataPPM(data: any[]): Stock[] {
    return data.map(v => <Stock>{ date: this.parseDate(v.date), value: v.value1 });
  }

  private initSvg() {
    this.svg = d3.select("#monitor-container").select("svg");

    //change********
    if(this.category.type == 'double'){
      this.colors = d3Scale.scaleOrdinal()
      .domain(["PH", "PPM"])
      .range(["red", "blue"]);
    }else{
      this.colors = d3Scale.scaleOrdinal()
      .domain([this.category.value])
      .range(["blue"]);
    }

    this.width = +this.svg.attr('width') - this.margin.left - this.margin.right;
    this.height = +this.svg.attr('height') - this.margin.top - this.margin.bottom;
   // this.height2 = +this.svg.attr('height') - this.margin2.top - this.margin2.bottom;

    console.log('Height: ', this.height);
    this.x = d3Scale.scaleTime().range([0, this.width]);
    this.x2 = d3Scale.scaleTime().range([0, this.width]);
    this.y = d3Scale.scaleLinear().range([this.height, 0]);
    //this.y2 = d3Scale.scaleLinear().range([this.height, 0]);

    this.xAxis = d3Axis.axisBottom(this.x);
    //this.xAxis2 = d3Axis.axisBottom(this.x2);
    this.yAxis = d3Axis.axisLeft(this.y);

    this.brush = d3Brush.brushX()
      .extent([[0, 0], [this.width, this.height]])//height2
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

    /*this.area2 = d3Shape.area()
      .curve(d3Shape.curveMonotoneX)
      .x((d: any) => this.x2(d.date))
      .y0(this.height2)
      .y1((d: any) => this.y2(d.value));*/

    this.svg.append('defs').append('clipPath')
      .attr('id', 'clip')
      .append('rect')
      .attr('width', this.width)
      .attr('height', this.height);

    this.focus = this.svg.append('g')
      .attr('class', 'focus')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');

    /*this.context = this.svg.append('g')
      .attr('class', 'context')
      .style('visibility', 'hidden')
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')');//margin2*/
  }

  private brushed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'zoom') return; // ignore brush-by-zoom
    let s = d3.event.selection || this.x2.range();
    this.x.domain(s.map(this.x2.invert, this.x2));
    this.focus.selectAll('.area').attr('d', this.area);
    this.focus.selectAll('.axis--x').call(this.xAxis);
    this.svg.selectAll('.zoom').call(this.zoom.transform, d3Zoom.zoomIdentity
      .scale(this.width / (s[1] - s[0]))
      .translate(-s[0], 0));
  }

  private zoomed() {
    if (d3.event.sourceEvent && d3.event.sourceEvent.type === 'brush') return; // ignore zoom-by-brush
    let t = d3.event.transform;
    this.x.domain(t.rescaleX(this.x2).domain());
    this.focus.selectAll('.area').attr('d', this.area);
    this.focus.selectAll('.axis--x').call(this.xAxis);
    this.context.selectAll('.brush').call(this.brush.move, this.x.range().map(t.invertX, t));
  }

  private drawChart(data: Stock[], color: any) {

    // console.log('Pool data :', data);
    this.x.domain(d3Array.extent(data, (d: Stock) => d.date));
    if (this.category.type === 'single')
      this.y.domain([0, d3Array.max(data, (d: Stock) => d.value) * 1.2]);
    if (this.category.type === 'double')
      this.y.domain([0, 10]);
    this.x2.domain(this.x.domain());
    //this.y2.domain(this.y.domain());    

    //change********
    this.focus.append('g')
      .attr('class', 'axis axis--y')
      .call(this.yAxis)
      .append("text")
      .style("font-size", "1.2em")
      .attr("transform", "translate(-7,100), rotate(-90)")
      .attr("y", 2)
      .attr("dy", "-2.5em")
      .attr("fill", "#000")
      .text(this.category.value);

    this.focus.append('path')
      .datum(data)
      .attr('class', 'area')
      .style('fill', 'none')
      .style('stroke-width', '0.5px')
      .attr('d', this.area)
      .attr('stroke', color);//this.colors.range()//this.colors//color

      //change********
    this.focus.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', 'translate(0,' + this.height + ')')
      .call(this.xAxis)
      .append("text")
      .style("font-size", "1.2em")
      .attr("transform", "rotate(0)")
      .attr("x", 390)
      .attr("dy", "3.0em")
      .style('fill', "black")
      .text("Time");

    // this.focus.append('g')
    //   .attr('class', 'axis axis--y')
    //   .call(this.yAxis);


   /* this.context.append('path')
      .datum(data)
      .attr('class', 'area')
      .style('fill', 'none')
      .attr('d', this.area2)
      .attr('stroke', color);;

    this.context.append('g')
      .attr('class', 'axis axis--x')
      .attr('transform', 'translate(0,' + this.height2 + ')')
      .call(this.xAxis2);

    this.context.append('g')
      .attr('class', 'brush')
      .call(this.brush)
      .call(this.brush.move, this.x.range());*/

    this.svg.append('rect')
      .attr('class', 'zoom')
      .style('cursor', 'move')
      .style('fill', 'none')
      .style('pointer-events', 'all')
      .attr('width', this.width)
      .attr('height', this.height)
      .attr('transform', 'translate(' + this.margin.left + ',' + this.margin.top + ')')
      .call(this.zoom);

  }

  //change********
  getLegend(legend) {

    //Legend

    var dataL = 0;
    var offset = 40;

    if (legend) {
      var legend = this.svg
        .selectAll('.legend')
        .data(this.colors.domain())
        .enter()
        .append('g')
        .attr('class', 'legend')
        .attr("transform", function (d, i) {
            if (i === 0) {
              dataL = d.length + offset 
              return "translate(0,0)"
            } else { 
              var newdataL = dataL
              dataL +=  d.length + offset
             return "translate(" + (newdataL) + ",0)"
            }
        })
      legend
        .append('rect')
        .attr('width', 10)
        .attr('height', 10)  
        .attr('x', 10)
        .attr('y', 295)      
        .style('fill', this.colors);

      legend
        .append('text')
        .attr('x', 24)
        .attr('y', 303)
        .attr('dy', '.1em')
        .text((d) => d);
    }
  }

}

