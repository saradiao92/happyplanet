// add your JavaScript/D3 to this file

const container = d3.select("#map-container");

const width = container.node().offsetWidth;
const height = container.node().offsetHeight;


const svg = container.append("svg")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", `0 0 ${width} ${height}`)
    .style("background-color", "#f0f8ff");

const mapGroup = svg.append("g");

const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

const sliderContainer = d3.select("body")
    .append("div")
    .style("position", "absolute")
    .style("top", `${height + 200}px`) 
    .style("left", "50%")
    .style("transform", "translateX(-50%)")
    .style("width", `${width * 0.8}px`)
    .style("text-align", "center")
    .style("z-index", "10");

const slider = sliderContainer.append("input")
    .attr("type", "range")
    .attr("min", 0)
    .attr("step", 1)
    .style("width", "100%")
    .style("margin", "0");

const sliderLabel = sliderContainer.append("div")
    .style("margin-top", "5px")
    .style("font-size", "14px");

const projection = d3.geoMercator()
    .scale(120)
    .translate([width / 2, height / 2]);

const path = d3.geoPath().projection(projection);

const zoom = d3.zoom()
    .scaleExtent([1, 8])
    .on("zoom", (event) => {
        mapGroup.attr("transform", event.transform);
    });

svg.call(zoom);

const colorScale = d3.scaleSequential(d3.interpolateBlues)
    .domain([0, 80]);

Promise.all([
    d3.json("https://raw.githubusercontent.com/holtzy/D3-graph-gallery/master/DATA/world.geojson"),
    d3.csv("https://raw.githubusercontent.com/hanq0223/happyplanet/refs/heads/main/data/hpi_map_full.csv")
]).then(([geoData, hpiData]) => {
    const parsedData = d3.group(hpiData, d => d.year);
    const years = Array.from(parsedData.keys()).sort();
    let currentYearIndex = years.length - 1;
    let currentYear = years[currentYearIndex];

    slider
        .attr("max", years.length - 1)
        .attr("value", currentYearIndex);

    sliderLabel.text(`Year: ${currentYear}`);

    function updateMap(year) {
        const yearData = new Map(parsedData.get(year).map(d => [d.ISO, +d.HPI]));

        mapGroup.selectAll("path")
            .data(geoData.features)
            .join("path")
            .attr("d", path)
            .attr("fill", d => {
                const hpiScore = yearData.get(d.id);
                return hpiScore !== undefined ? colorScale(hpiScore) : "#ccc";
            })
            .attr("stroke", "#333")
            .attr("stroke-width", 0.5)
            .on("mouseover", function(event, d) {
                const hpiScore = yearData.get(d.id);
                tooltip.style("opacity", 1)
                    .html(`${d.properties.name}<br>HPI: ${hpiScore !== undefined ? hpiScore : "N/A"}`)
                    .style("left", `${event.pageX + 5}px`)
                    .style("top", `${event.pageY + 5}px`);
            })
            .on("mousemove", function(event) {
                tooltip.style("left", `${event.pageX + 5}px`)
                    .style("top", `${event.pageY + 5}px`);
            })
            .on("mouseout", function() {
                tooltip.style("opacity", 0);
            });
    }

    updateMap(currentYear);

    slider.on("input", function() {
        currentYearIndex = +this.value;
        currentYear = years[currentYearIndex];
        sliderLabel.text(`Year: ${currentYear}`);
        updateMap(currentYear);
    });

}).catch(error => {
    console.error("Error loading data:", error);
});