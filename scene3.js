d3.csv("inflation interest unemployment.csv").then(function(data) {
    
    var recentData = data.filter(function(d) { return d.year >= 2018 && d.year <= 2022 });
    
    const incomeGroups = ["Low income", "Lower middle income", "Upper middle income", "High income"];
    
    var avgData = [];
    for(let i = 0; i < incomeGroups.length; i++) {
        var income = incomeGroups[i];
        const groupData = recentData.filter(d => d.incomeLevel === income);
        var avgInf = d3.mean(groupData, d => +d["Inflation, consumer prices (annual %)"]) || 0;
        var avgReal = d3.mean(groupData, d => +d["Real interest rate (%)"]) || 0;
        avgData.push({
            incomeLevel: income,
            avgInflation: avgInf,
            avgRealInterest: avgReal
        });
    }
    
    var margin = {top: 50, right: 50, bottom: 100, left: 70};
    var width = 800 - margin.left - margin.right;
    const height = 400 - margin.top - margin.bottom;
    
    const svg = d3.select("#chart")
        .append("svg")
        .attr("width", width + margin.left + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");
    
    var x0Scale = d3.scaleBand()
        .domain(incomeGroups)
        .range([0, width])
        .padding(0.1);
    
    const x1Scale = d3.scaleBand()
        .domain(["avgInflation", "avgRealInterest"])
        .range([0, x0Scale.bandwidth()])
        .padding(0.05);
    
    var yScale = d3.scaleLinear()
        .domain([
            Math.min(0, d3.min(avgData, function(d) { return Math.min(d.avgInflation, d.avgRealInterest) })),
            Math.max(0, d3.max(avgData, function(d) { return Math.max(d.avgInflation, d.avgRealInterest) }))
        ])
        .range([height, 0]);
    
    const colorScale = d3.scaleOrdinal()
        .domain(["avgInflation", "avgRealInterest"])
        .range(["#e74c3c", "#3498db"]);
    
    svg.append("g")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x0Scale))
        .selectAll("text")
        .attr("transform", "rotate(-45)")
        .style("text-anchor", "end");
    
    svg.append("g")
        .call(d3.axisLeft(yScale));
    
    svg.append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - margin.left)
        .attr("x", 0 - (height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text("Rate (%)");
    
    var groups = svg.selectAll(".group")
        .data(avgData)
        .enter().append("g")
        .attr("transform", function(d) { return "translate(" + x0Scale(d.incomeLevel) + ",0)" });
    
    groups.selectAll("rect")
        .data(function(d) { 
            return [
                {key: "avgInflation", value: d.avgInflation},
                {key: "avgRealInterest", value: d.avgRealInterest}
            ] 
        })
        .enter().append("rect")
        .attr("x", function(d) { return x1Scale(d.key) })
        .attr("y", function(d) { return d.value > 0 ? yScale(d.value) : yScale(0) })
        .attr("width", x1Scale.bandwidth())
        .attr("height", function(d) { return Math.abs(yScale(d.value) - yScale(0)) })
        .attr("fill", function(d) { return colorScale(d.key) });
    
    svg.append("line")
        .attr("x1", 0)
        .attr("x2", width)
        .attr("y1", yScale(0))
        .attr("y2", yScale(0))
        .attr("stroke", "black")
        .attr("stroke-width", 2);
    
    const legend = svg.selectAll(".legend")
        .data(["Average Inflation", "Average Real Interest Rate"])
        .enter().append("g")
        .attr("transform", function(d, i) { return "translate(" + (width - 200) + "," + (i * 25) + ")" });
    
    legend.append("rect")
        .attr("width", 18)
        .attr("height", 18)
        .style("fill", function(d, i) { return colorScale(i === 0 ? "avgInflation" : "avgRealInterest") });
    
    legend.append("text")
        .attr("x", 24)
        .attr("y", 9)
        .attr("dy", ".35em")
        .text(function(d) { return d });
});