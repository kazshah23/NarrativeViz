d3.csv("inflation interest unemployment.csv").then(function(data) {
    
    const filteredData = data.filter(d => d.year >= 2000 && d.year <= 2022);
    
    var regions = [...new Set(filteredData.map(d => d.adminregion))].filter(d => d && d !== "");
    
    const regionData = [];
    for(var i=0; i<regions.length; i++) {
        var region = regions[i];
        const regionValues = d3.rollup(
            filteredData.filter(d => d.adminregion === region),
            v => d3.mean(v, d => +d["Inflation, consumer prices (annual %)"]),
            d => +d.year
        );
        
        var values = Array.from(regionValues, ([year, inflation]) => ({
            year: year,
            inflation: inflation
        })).filter(d => !isNaN(d.inflation));
        
        if (values.length > 0) {
            regionData.push({
                region: region,
                values: values
            });
        }
    }
    
    var margin = {top: 50, right: 200, bottom: 50, left: 70};
    const width = 900 - margin.left - margin.right;
    const height = 500 - margin.top - margin.bottom;
    
    var svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    var xScale = d3.scaleLinear()
        .domain([2000, 2022])
        .range([0, width]);
    
    const yScale = d3.scaleLinear()
        .domain([
            0,
            d3.max(regionData, d => d3.max(d.values, v => v.inflation))
        ])
        .range([height, 0]);
    
    var colorScale = d3.scaleOrdinal()
        .domain(regions)
        .range(d3.schemeCategory10);
    
    const line = d3.line()
        .x(function(d) { return xScale(d.year) })
        .y(function(d) { return yScale(d.inflation) })
        .curve(d3.curveMonotoneX);
    
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));
    
    svg.append("g")
        .call(d3.axisLeft(yScale));
    
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Average Inflation Rate (%)");
    
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom)
        .style("text-anchor", "middle")
        .text("Year");
    
    svg.append("g")
        .attr("class", "grid")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale)
            .tickSize(-height)
            .tickFormat("")
        );
    
    svg.append("g")
        .attr("class", "grid")
        .call(d3.axisLeft(yScale)
            .tickSize(-width)
            .tickFormat("")
        );
    
    for(var j=0; j<regionData.length; j++) {
        svg.append("path")
            .datum(regionData[j].values)
            .attr("fill", "none")
            .attr("stroke", colorScale(regionData[j].region))
            .attr("stroke-width", 2)
            .attr("d", line)
            .attr("class", "line");
    }
    
    var legend = svg.selectAll(".legend")
        .data(regions)
        .enter().append("g")
        .attr("class", "legend")
        .attr("transform", function(d, i) { return "translate(" + (width + 10) + "," + (i * 20) + ")" });
    
    legend.append("rect")
        .attr("width", 18)
        .attr("height", 3)
        .style("fill", colorScale);
    
    legend.append("text")
        .attr("x", 24)
        .attr("y", 3)
        .attr("dy", ".35em")
        .style("font-size", "11px")
        .text(function(d) { return d });
    
    
    var annotations = [];
    
    regionData.forEach(region => {
        var data2008 = region.values.find(d => d.year === 2008);
        var data2009 = region.values.find(d => d.year === 2009);
        
        if (data2008 && data2009 && region.region === "Sub-Saharan Africa") {
            annotations.push({
                note: { 
                    label: "2008 Financial Crisis impact on Africa",
                    wrap: 150
                },
                x: xScale(2009),
                y: yScale(data2009.inflation),
                dx: -80,
                dy: -50
            });
        }
    });
    
    regionData.forEach(region => {
        const data2022 = region.values.find(d => d.year === 2022);
        
        if (data2022 && region.region === "Europe & Central Asia" && data2022.inflation > 10) {
            annotations.push({
                note: { 
                    label: "2022 inflation spike in Europe",
                    wrap: 150
                },
                x: xScale(2022),
                y: yScale(data2022.inflation),
                dx: -100,
                dy: -30
            });
        }
    });
    
    var latinAmerica = regionData.find(d => d.region === "Latin America & Caribbean");
    if (latinAmerica) {
        var maxInflation = d3.max(latinAmerica.values, d => d.inflation);
        var maxYear = latinAmerica.values.find(d => d.inflation === maxInflation);
        
        if (maxYear && maxYear.year >= 2020) {
            annotations.push({
                note: { 
                    label: "Latin America inflation surge",
                    wrap: 150
                },
                x: xScale(maxYear.year),
                y: yScale(maxYear.inflation),
                dx: 50,
                dy: -50
            });
        }
    }
    
    if (annotations.length > 0) {
        var makeAnnotations = d3.annotation()
            .annotations(annotations);
        
        svg.append("g")
            .attr("class", "annotation-group")
            .call(makeAnnotations);
    }
});