// Configuración del tamaño del gráfico
const width = 1300;
const height = 500;

// Creación del tooltip para mostrar información al hacer hover sobre las celdas
const tooltip = d3
    .select(".graph")
    .append("div")
    .attr("id", "tooltip")
    .style("opacity", 0);

// Contenedor SVG para el gráfico principal
const svgContainer = d3
    .select(".graph")
    .append("svg")
    .attr("class", "map")
    .attr("width", 1500)
    .attr("height", 750);

// Formateo de la fecha (meses en texto)
const formatTime = d3.utcFormat("%B");

// Colores para el mapa de calor (gradiente de temperatura)
const colors = [
    "#a50026", "#d73027", "#f46d43", "#fdae61", "#fee090",
    "#ffffbf", "#e0f3f8", "#abd9e9", "#74add1", "#4575b4", "#313695"
];

// Nombres de los meses para formatear el eje Y
const monthNames = {
    0: "January", 1: "February", 2: "March", 3: "April", 4: "May", 5: "June",
    6: "July", 7: "August", 8: "September", 9: "October", 10: "November", 11: "December"
};

// Carga del conjunto de datos JSON
d3.json(
    "https://raw.githubusercontent.com/freeCodeCamp/ProjectReferenceData/master/global-temperature.json"
)
    .then(({ monthlyVariance }) => {
        // Texto de referencia para el eje Y (meses)
        svgContainer
            .append("text")
            .attr("transform", "rotate(-90)")
            .attr("x", -275)
            .attr("y", 40)
            .text("Months")
            .style("font-size", "20px");

        // Extracción de datos del JSON
        const months = monthlyVariance.map(({ month }) => month);
        const years = monthlyVariance.map(({ year }) => year);
        const temperatures = monthlyVariance.map(({ variance }) => variance + 8.66);

        // Escala para el eje X (años)
        const xScale = d3.scaleBand().domain(years).range([0, width]);

        // Renderizado del eje X
        svgContainer
            .append("g")
            .call(
                d3.axisBottom(xScale)
                    .tickValues(xScale.domain().filter((year) => year % 10 === 0)) // Filtrar para mostrar solo años que son múltiplos de 10
            )
            .attr("id", "x-axis")
            .attr("transform", `translate(100, ${height})`);

        // Escala para el eje Y (meses)
        const yScale = d3
            .scaleBand()
            .domain([0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11])
            .rangeRound([0, height]);

        // Renderizado del eje Y con formato de meses
        svgContainer
            .append("g")
            .call(d3.axisLeft(yScale).tickFormat((month) => monthNames[month]))
            .attr("id", "y-axis")
            .attr("transform", "translate(100, 0)");

        // Variancia de temperaturas
        const variance = monthlyVariance.map(val => val.variance);
        const minTemp = 8.66 + Math.min(...variance);
        const maxTemp = 8.66 + Math.max(...variance);
        const legendHeight = 300 / colors.length;
        const legendColors = colors.reverse();

        // Escala de umbral para los colores del mapa de calor
        const legendThreshold = d3
            .scaleThreshold()
            .domain(
                (function (min, max, count) {
                    const array = [];
                    const step = (max - min) / count;
                    for (let i = 1; i < count; i++) {
                        array.push(min + i * step);
                    }
                    return array;
                })(minTemp, maxTemp, legendColors.length)
            )
            .range(legendColors);

        // Escala y configuración del eje X de la leyenda
        const legendX = d3.scaleLinear().domain([minTemp, maxTemp]).range([0, 400]);
        const legendXAxis = d3
            .axisBottom(legendX)
            .tickSize(10, 0)
            .tickValues(legendThreshold.domain())
            .tickFormat(d3.format(".1f"));

        // Contenedor y renderizado de la leyenda
        const legend = svgContainer
            .append("g")
            .classed("legend", true)
            .attr("id", "legend")
            .attr("transform", `translate(60, ${10 + 550 + 80 - 2 * legendHeight})`);

        // Eje X de la leyenda
        legend.append("g").attr("transform", `translate(0, ${legendHeight})`).call(legendXAxis);

        // Renderizado de las celdas del mapa de calor
        d3.select("svg")
            .selectAll("rect")
            .data(monthlyVariance)
            .join("rect")
            .attr("data-year", d => d.year)
            .attr("data-month", d => d.month - 1)
            .attr("data-temp", (d, i) => temperatures[i])
            .attr("class", "rect cell")
            .attr("x", d => xScale(d.year))
            .attr("y", d => yScale(d.month - 1))
            .attr("width", xScale.bandwidth())
            .attr("height", yScale.bandwidth())
            .attr("transform", "translate(100, 0)")
            .style("fill", (d, i) => legendThreshold(temperatures[i]))
            .on("mouseover", (event, d) => {
                tooltip
                    .html(
                        `${d.year} - ${monthNames[d.month - 1]}<br/>${(d.variance + 8.66).toFixed(2)}°C<br/>${d.variance.toFixed(2)}`
                    )
                    .attr("data-year", d.year)
                    .style("left", `${event.pageX}px`)
                    .style("top", `${event.pageY - 28}px`)
                    .style("opacity", 0.9);
            })
            .on("mouseout", () => {
                tooltip.style("opacity", 0);
            });

        // Renderizado de la leyenda
        legend
            .append("g")
            .selectAll("rect")
            .data(
                legendThreshold.range().map(color => {
                    const d = legendThreshold.invertExtent(color);
                    if (d[0] === null) d[0] = legendX.domain()[0];
                    if (d[1] === null) d[1] = legendX.domain()[1];
                    return d;
                })
            )
            .enter()
            .append("rect")
            .style("fill", d => legendThreshold(d[0]))
            .attr("x", d => legendX(d[0]))
            .attr("y", 0)
            .attr("width", d => legendX(d[1]) - legendX(d[0]))
            .attr("height", legendHeight);
    })
    .catch(e => console.log(e));
