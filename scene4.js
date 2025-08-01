let allData = [];

Promise.all([
    d3.csv("inflation interest unemployment.csv"),
    d3.csv("API_NY.GDP.PCAP.CD_DS2_en_csv_v2_122367.csv")
]).then(function(results) {
    var inflationData = results[0];
    var gdpData = results[1];
    
    const gdpByCountryYear = {};
    for(var i=0; i<gdpData.length; i++) {
        var row = gdpData[i];
        var country = row["Country Name"];
        if (country) {
            for (let year = 2000; year <= 2022; year++) {
                var value = row[year.toString()];
                if (value) {
                    var key = country + "_" + year;
                    gdpByCountryYear[key] = +value;
                }
            }
        }
    }
    
    allData = inflationData.filter(function(d) { return d.year >= 2000 && d.year <= 2022 }).map(function(d) {
        const key = d.country + "_" + d.year;
        return {
            country: d.country,
            year: +d.year,
            inflation: +d["Inflation, consumer prices (annual %)"],
            unemployment: +d["Unemployment, total (% of total labor force) (modeled ILO estimate)"],
            gdp: gdpByCountryYear[key] || null
        };
    });
    
    var countries = [...new Set(allData.map(d => d.country))].sort();
    const select = d3.select("#countrySelect");
    
    select.selectAll("option")
        .data(countries)
        .enter().append("option")
        .attr("value", function(d) { return d })
        .text(function(d) { return d });
    
    drawChart("United States");
    
    select.on("change", function() {
        drawChart(this.value);
    });
});

function drawChart(selectedCountry) {
    d3.select("#chart").html("");
    
    const countryData = allData.filter(function(d) { return d.country === selectedCountry });
    
    var margin = {top: 50, right: 150, bottom: 50, left: 70};
    const width = 800 - margin.left - margin.right;
    var height = 400 - margin.top - margin.bottom;
    
    var svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    var xScale = d3.scaleLinear()
        .domain([2000, 2022])
        .range([0, width]);
    
    const yScaleLeft = d3.scaleLinear()
        .domain([
            Math.min(0, d3.min(countryData, function(d) { return Math.min(d.inflation || 0, d.unemployment || 0) })),
            Math.max(10, d3.max(countryData, function(d) { return Math.max(d.inflation || 0, d.unemployment || 0) }))
        ])
        .range([height, 0]);
    
    var yScaleRight = d3.scaleLinear()
        .domain([0, d3.max(countryData, function(d) { return d.gdp || 0 })])
        .range([height, 0]);
    
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));
    
    svg.append("g")
        .call(d3.axisLeft(yScaleLeft));
    
    svg.append("g")
        .attr("transform", "translate(" + width + ",0)")
        .call(d3.axisRight(yScaleRight));
    
    svg.append("text")
        .attr("x", width / 2)
        .attr("y", height + margin.bottom)
        .style("text-anchor", "middle")
        .text("Year");
    
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Inflation & Unemployment (%)");
    
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", width + 100)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("GDP per Capita ($)");
    
    const lineInflation = d3.line()
        .defined(function(d) { return !isNaN(d.inflation) })
        .x(function(d) { return xScale(d.year) })
        .y(function(d) { return yScaleLeft(d.inflation) });
    
    var lineUnemployment = d3.line()
        .defined(function(d) { return !isNaN(d.unemployment) })
        .x(function(d) { return xScale(d.year) })
        .y(function(d) { return yScaleLeft(d.unemployment) });
    
    const lineGDP = d3.line()
        .defined(function(d) { return d.gdp !== null })
        .x(function(d) { return xScale(d.year) })
        .y(function(d) { return yScaleRight(d.gdp) });
    
    svg.append("path")
        .datum(countryData)
        .attr("fill", "none")
        .attr("stroke", "red")
        .attr("stroke-width", 2)
        .attr("d", lineInflation);
    
    svg.append("path")
        .datum(countryData)
        .attr("fill", "none")
        .attr("stroke", "orange")
        .attr("stroke-width", 2)
        .attr("d", lineUnemployment);
    
    svg.append("path")
        .datum(countryData)
        .attr("fill", "none")
        .attr("stroke", "green")
        .attr("stroke-width", 2)
        .attr("d", lineGDP);
    
    var tooltip = d3.select("body").append("div")
        .attr("class", "tooltip");
    
    function addDots(data, yScale, color, valueKey, label) {
        svg.selectAll(".dot-" + valueKey)
            .data(data.filter(function(d) { return valueKey === "gdp" ? d[valueKey] !== null : !isNaN(d[valueKey]) }))
            .enter().append("circle")
            .attr("cx", function(d) { return xScale(d.year) })
            .attr("cy", function(d) { return yScale(d[valueKey]) })
            .attr("r", 4)
            .attr("fill", color)
            .on("mouseover", function(event, d) {
                tooltip.transition().duration(200).style("opacity", .9);
                tooltip.html(
                    "<strong>" + d.year + "</strong><br/>" +
                    "Inflation: " + (d.inflation ? d.inflation.toFixed(2) + "%" : "N/A") + "<br/>" +
                    "Unemployment: " + (d.unemployment ? d.unemployment.toFixed(2) + "%" : "N/A") + "<br/>" +
                    "GDP per capita: " + (d.gdp ? "$" + d.gdp.toFixed(0) : "N/A")
                )
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
            })
            .on("mouseout", function() {
                tooltip.transition().duration(500).style("opacity", 0);
            });
    }
    
    addDots(countryData, yScaleLeft, "red", "inflation", "Inflation");
    addDots(countryData, yScaleLeft, "orange", "unemployment", "Unemployment");
    addDots(countryData, yScaleRight, "green", "gdp", "GDP per Capita");
    
    var legendData = [
        {name: "Inflation", color: "red"},
        {name: "Unemployment", color: "orange"},
        {name: "GDP per Capita", color: "green"}
    ];
    
    const legend = svg.selectAll(".legend")
        .data(legendData)
        .enter().append("g")
        .attr("transform", function(d, i) { return "translate(" + (width - 120) + "," + (i * 25) + ")" });
    
    legend.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", function(d) { return d.color });
    
    legend.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .text(function(d) { return d.name });
}