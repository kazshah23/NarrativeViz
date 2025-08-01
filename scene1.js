d3.csv("inflation interest unemployment.csv").then(function(data) {
    
    var filteredData = data.filter(d => d.year >= 2000 && d.year <= 2022);
    
    const avgByYear = d3.rollup(
        filteredData,
        v => d3.mean(v, d => +d["Inflation, consumer prices (annual %)"]),
        d => +d.year
    );
    
    var lineData = Array.from(avgByYear, ([year, inflation]) => ({
        year: year,
        inflation: inflation
    })).filter(d => !isNaN(d.inflation));
    
    
    var margin = {top: 50, right: 50, bottom: 50, left: 70};
    var width = 800 - margin.left - margin.right;
    var height = 400 - margin.top - margin.bottom;
    
    var svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    const xScale = d3.scaleLinear()
        .domain([2000, 2022])
        .range([0, width]);
    
    var yScale = d3.scaleLinear()
        .domain([0, d3.max(lineData, d => d.inflation)])
        .range([height, 0]);
    
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.inflation));
    
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
    
    svg.append("path")
        .datum(lineData)
        .attr("fill", "none")
        .attr("stroke", "steelblue")
        .attr("stroke-width", 2)
        .attr("d", line);
    
    svg.selectAll(".dot")
        .data(lineData)
        .enter().append("circle")
        .attr("cx", function(d) { return xScale(d.year) })
        .attr("cy", function(d) { return yScale(d.inflation) })
        .attr("r", 4)
        .attr("fill", "steelblue");
    
    var annotations = [
        {
            note: { label: "Financial Crisis" },
            x: xScale(2008),
            y: yScale(lineData.find(d => d.year === 2008).inflation),
            dx: -50,
            dy: -50
        },
        {
            note: { label: "Pandemic Shock" },
            x: xScale(2020),
            y: yScale(lineData.find(d => d.year === 2020).inflation),
            dx: 50,
            dy: -50
        },
        {
            note: { label: "Post-COVID Spike" },
            x: xScale(2022),
            y: yScale(lineData.find(d => d.year === 2022).inflation),
            dx: -50,
            dy: -30
        }
    ];
    
    const makeAnnotations = d3.annotation()
        .annotations(annotations);
    
    svg.append("g")
        .call(makeAnnotations);
});