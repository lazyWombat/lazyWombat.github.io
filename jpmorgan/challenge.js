const run = async (aliases) => {
    const startYear = 2005, endYear = 2019;

    var strokeWidth = [12,8,8,6,6,4,4,2,2,2];

    // prepare alias map
    const aliasMap = {}
    aliases.forEach(names => names.forEach(name => aliasMap[name] = names))

    const getKey = result =>
        `${aliasMap[result.TEAM_NAME] ? aliasMap[result.TEAM_NAME][0] : result.TEAM_NAME} " ${result.DISPLAY_NAME}`

    const getTotalSeconds = result => {
        if (!result.TIME) return undefined;
        const parts = result.TIME.split(':');
        if (parts.length === 2) return (parseInt(parts[0]) * 60 + parseInt(parts[1])) || undefined;
        if (parts.length === 3) return (parseInt(parts[0]) * 3600 + parseInt(parts[1]) * 60 + parseInt(parts[2])) || undefined;
        return undefined;
    }

    const results = {}
    const keys = []
    const nkeys = {}
    const sortedResults = {}

    let progress = 0
    const progressElement = d3.select('#progress')
    const updateProgress = () => {
        progress = progress + 1
        progressElement.style('width', `${progress * 300 / (endYear - startYear) }px`).style('border-width', progress ? '1px' : '0')
    }
    await Promise.all(d3.range(startYear, endYear + 1).map(async year => {
        const data = await d3.json(`data/i${year}.json`);
        if (!data || !data.RESULTS) return;
        sortedResults[year] = []
        data.RESULTS.forEach(d => {
            d.year = year;
            const key = getKey(d);            
            if (!results[key]) {
                d.nkey = keys.push(key)
                nkeys[d.nkey] = key
                results[key] = { nkey: d.nkey }
            } else {
                d.nkey = results[key].nkey;
            }
            d.totalSeconds = getTotalSeconds(d)
            if (results[key][year] && results[key][year].totalSeconds <= d.totalSeconds) {
                // do nothing
            } else results[key][year] = d
            sortedResults[year].push(d)
        })
        sortedResults[year].sort((a,b) => 
            d3.ascending(a.totalSeconds, b.totalSeconds) ||
            d3.ascending(a.OVERALL, b.OVERALL) ||
            d3.ascending(a.BIB_NUMBER, b.BIB_NUMBER))
        updateProgress()
    }))
    keys.forEach(key => {
        results[key].values = d3.keys(results[key]).filter(p => p !== 'nkey').map(p => results[key][p])
    })

    const margin = { top: 20, right: 30, bottom: 30, left: 50 }
    const parent = d3.select('#chart')
    const width = Math.max(parent.node().clientWidth, 800) - margin.left - margin.right - 10
    const height = 500 - margin.top - margin.bottom

    const colors = {
        male: [
            "#B5C660", "#B3C762", "#B0C765", "#ADC767", "#AAC769", "#A7C76A", "#A3C66B", "#9FC46B", "#9AC26A", 
            "#94BF68", "#8EBB66", "#87B662", "#7FB05E", "#75AA5A", "#6BA354", "#609B4F", "#549249", "#478943", "#39803D", 
            "#2C7739", "#206F36", "#166A35", "#0F6638", "#0B663E", "#0C6A48", "#127257", "#1B7D6A", "#27897F", "#359795", 
            "#42A4AB", "#4EB0C0", "#58BAD3", "#5DBFE2", "#5DC0EC", "#5ABCF2", "#52B5F4", "#49ABF3", "#3E9FEE", "#3292E7", 
            "#2785DE", "#1E77D3", "#176AC7", "#125EBA", "#0F53AB", "#0E489C", "#0D3E8D", "#0E347D", "#0F2B6C", "#11215C" ],
        female: [
            "#FFC600", "#FEC606", "#FEC60B", "#FDC710", "#FDC716", "#FCC61B", "#FCC61F", "#FCC523", "#FBC427", 
		    "#FBC22B", "#FBC02D", "#FBBD2F", "#FBBA31", "#FBB632", "#FBB132", "#FCAC31", "#FCA730", "#FDA12F", "#FD9B2D", 
		    "#FE952C", "#FE8F2A", "#FF8929", "#FF8428", "#FF7E27", "#FF7927", "#FF7527", "#FF7128", "#FE6E29", "#FE6A2B", 
		    "#FD682D", "#FC652F", "#FB6330", "#FA6032", "#F95E33", "#F85C34", "#F65A34", "#F55733", "#F35432", "#F15230", 
		    "#F04F2D", "#EE4B2A", "#EC4827", "#EA4524", "#E84221", "#E63E1F", "#E43B1D", "#E2381C", "#E0351C", "#DD321E", 
		    "#DB3020", "#D92E25", "#D62C2B", "#D42A31", "#D22939", "#CF2841", "#CD274A", "#CB2754", "#C8275D", "#C62866", 
		    "#C4296F", "#C22A77", "#BF2C7F", "#BD2E86", "#BB308C", "#B93391", "#B73596", "#B5389A", "#B33B9D", "#B13EA0", 
		    "#AE41A2", "#AC43A3", "#A946A4", "#A648A4", "#A349A4", "#9F4AA3", "#9B4BA2", "#974BA1", "#934B9F", "#8E4A9D", 
            "#8A499A", "#854897", "#804795", "#7B4692", "#76448E", "#71438B", "#6C4188"]
    }

    const xScale = d3.scaleLinear().domain([startYear, endYear]).range([0, width]);
    const yScale = d3.scaleLinear().domain([0.5, 10.5]).range([0, height])

    var xAxis = d3.axisBottom(xScale).tickFormat(d3.format('d')).tickSize(0);
    var yAxis = d3.axisLeft(yScale).tickSize(0);

    var chart = parent.append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g').attr('transform', `translate(${margin.left},${margin.top})`)

    chart.append('defs').append('clipPath')
        .attr('id', 'clip')
        .append('rect')
        .attr('width', width)
        .attr('height', height)

    chart.append('g')
        .attr('class', 'x axis')
        .style('font-size', 13)
        .attr('transform', `translate(0, ${height + 9})`)
        .call(xAxis)

    chart.append('g')
        .attr('class', 'y axis')
        .attr('transform', 'translate(-10, 0)')
        .call(yAxis)
    .append('text')
        .attr('class', 'title')
        .attr('transform', 'rotate(-90)')
        .attr('x', -(height/2))
        .attr('y', -35)
        .attr('dy', '0.71em')
        .style('font-size', 14)
        .style('text-anchor', 'middle')
        .text('Position in Top 10')
    
    const tooltip = d3.select('#tooltip')

    const circleGroup = chart.append('g')
        .attr('transform', 'translate(-100, -100)')
        .style('pointer-events', 'none');
    
    circleGroup.append('circle')
        .attr('class', 'tooltipCircle')
        .attr('r', 3.5)

    const voronoiGroup = chart.append('g').attr('class', 'voronoi')
    const voronoi = d3.voronoi()
        .x(d => xScale(d.year))
        .y(d => yScale(d.position))
        .extent([[-margin.left, -margin.top], [width + margin.right, height + margin.bottom]]);


    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.position))
        .curve(d3.curveMonotoneX)

    // cancel loading animation
    d3.select('#loading').remove()
    d3.select('#content').style('visibility', 'visible')

    let sortedFilteredResults = {}
    let filteredResults = {}
    
    const filterData = (criteria) => {
        sortedFilteredResults = {}
        filteredResults = {}
        d3.range(startYear, endYear + 1).forEach(year => {
            sortedFilteredResults[year] = sortedResults[year].filter(criteria)
                .map((d, i) => ({ key: d.nkey, position: i + 1, year: d.year, data: d }))
            sortedFilteredResults[year].forEach(d => {
                if (!filteredResults[d.key]) filteredResults[d.key] = []
                filteredResults[d.key].push(d)
            })
        })
    }

    const createLegend = selector => {
        const element = d3.select(selector)
        const width = Math.min(element.node().clientWidth, 350)

        const legend = element.append('svg')
            .attr('width', width - 50)
            .attr('height', 50)
        .append('g')
            .attr('class', 'colorLegendWrapper')
            .attr('transform', `translate(25, 10)`)
        
        return { legend, width: width - 100 }
    }
    const createColorLegend = (type, colors) => {
        const { legend, width } = createLegend(`.colorLegend.${type}`)
        
        legend.append('defs')
            .append('linearGradient')
            .attr('id', 'gradient' + type)
            .attr('gradientUnits', 'userSpaceOnUse')
            .attr('x1', '0%').attr('y1', '0%')
            .attr('x2', '100%').attr('y2', '0%')
            .attr('spreadMethod', 'pad')
            .selectAll('stop')
            .data(colors)
            .enter().append('stop')
            .attr('offset', (_, i) => `${Math.floor(100*i/(colors.length - 1))}%`)
            .attr('stop-color', d => d)

        legend.append('rect')
            .attr('class', 'colorkey')
            .attr('x', 0).attr('y', -8)
            .attr('width', width)
            .attr('height', 16)
            .attr('opacity', .7)
            .attr('fill', `url(#gradient${type})`)
    }

    createColorLegend('male', colors.male)
    createColorLegend('female', colors.female)

    const { width: legendWidth, legend: thicknessLegend } = createLegend('.thicknessLegend')
    const stepWidth = legendWidth / strokeWidth.length * .8

    thicknessLegend.selectAll('.thicknessKey')
        .data(strokeWidth)
        .enter().append('rect')
            .attr('class', 'thicknessKey')
            .attr('x', (_, i) => legendWidth / strokeWidth.length * i)
            .attr('y', d => -d/2)
            .attr('width', stepWidth)
            .attr('height', d => d)
            .style('opacity', .7)
            .style('shape-rendering', 'crispEdges')
            .attr('fill', '#9c9c9c')
    thicknessLegend.selectAll('.thicknessKeyText')
        .data(strokeWidth)
        .enter().append('text')
            .attr('class', 'thicknessKeyText')
            .attr('x', (_, i) => legendWidth / strokeWidth.length * i + stepWidth / 2)
            .attr('y', 20)
            .style('text-anchor', 'middle')
            .text((_, i) => i + 1)
    
        
    const cachedPush = Array.prototype.push
    const cleanData = () => {
        voronoiGroup.selectAll('path').remove();
        chart.selectAll('.focus').remove();
        d3.select('#chart').classed('dimmed', true)
    }
    const showData = (size) => {
        cleanData()
        const flatData = [];
        d3.range(startYear, endYear + 1).forEach(year => 
            cachedPush.apply(flatData, sortedFilteredResults[year].slice(0, size)))

        const maxPosition = d3.nest()
            .key(d => d.key)
            .rollup(d => d3.min(d, g => g.position))
            .object(flatData);

        const nestedFlatData = d3.map(flatData, d => d.key).keys().map(key => {
            const knownValues = filteredResults[key]
            const sex = knownValues[0].data.SEX
            const displayName = knownValues[0].data.DISPLAY_NAME
            const values = []
            d3.range(startYear, endYear + 1).forEach(year => {
                values.push(knownValues.find(d => d.year === year) || { key, year, position: size + 1 })
            })
            return { key, sex, displayName, values }
        })
        
        const filteredFlatData = flatData.filter(d => d.year >= xScale.domain()[0] && d.year <= xScale.domain()[1])

        const getColor = d => {
            const sex = d.values ? d.sex : d.data.SEX
            const range = sex === 'F' ? colors.female : colors.male
            return range[d.key % range.length]
        }

        const getStrokeWidth = d => {
            const position = maxPosition[d.key]
            return strokeWidth[position >= strokeWidth.length ? strokeWidth.length - 1 : position]
        }

        const mouseover = (_,i) => {
            const d = filteredFlatData[i]
            chart.selectAll('.focus').style('opacity', .1)
            chart.selectAll(`.f${d.data.nkey}`).style('opacity', .8)

            circleGroup.attr('transform', `translate(${xScale(d.year)}, ${yScale(d.position)})`)
            const circleSize = parseInt(d3.selectAll(`.f${d.data.nkey}`).selectAll('.line').style('stroke-width'))
            circleGroup.select('.tooltipCircle').style('fill', getColor(d)).attr('r', circleSize)

            tooltip.selectAll('.metric-title').selectAll('.title').text(d.data.DISPLAY_NAME)
            tooltip.selectAll('.metric-title').selectAll('.right').text(`#${d.data.BIB_NUMBER}`)
            tooltip.selectAll('.time').selectAll('.metric-value').text(d.data.TIME)
            tooltip.selectAll('.team').selectAll('.metric-value').text(d.data.TEAM_NAME)
            tooltip.style('opacity', 1)
            new Popper(document.querySelector('.tooltipCircle'), document.querySelector('#tooltip'), { placement: 'top', modifiers: { offset: { offset: '0, 5' }}});
        }
        const mouseout = () => {
            tooltip.style('opacity', 0)
            chart.selectAll('.focus').style('opacity', .7)
            circleGroup.attr('transform', 'translate(-100, -100)')
        }
        const mouseclick = (_, i) => {
            const d = filteredFlatData[i]
            const results = filteredResults[d.key]

            d3.select('#record-name').text(`${d.data.DISPLAY_NAME} - ${d.data.TEAM_NAME}`)
            d3.select('#records').selectAll('tr').remove()
            const row = d3.select('#records').selectAll('tr').data(results).enter().append('tr')
            row.append('td').text(d => d.year)
            row.append('td').text(d => d.data.BIB_NUMBER)
            row.append('td').text(d => d.position)
            row.append('td').text(d => d.data.TIME)
        }

        voronoiGroup.selectAll('path')
            .data(voronoi(filteredFlatData).polygons())
            .enter().append('path')
            .attr('d', d => `M${d.join('L')}Z`)
            .datum(d => d.point)
            .attr('class', 'voronoiCells')
            .on('mouseover', mouseover)
            .on('mouseout', mouseout)
            .on('click', mouseclick)
        
        chart.selectAll('.focus')
            .data(nestedFlatData, d => d.key)
            .enter().append('g')
            .attr('class', d => `focus f${d.key}`)
            .append('path')
                .attr('class', 'line')
                .attr('clip-path', 'url(#clip)')
                .style('pointer-events', 'none')
                .style('stroke-linejoin', 'round')
                .style('opacity', 0)
                .attr('d', d => line(d.values))
                .style('stroke-width', getStrokeWidth)
                .style('stroke', getColor)
                .transition().duration(750)
                .style('opacity', .7)

        d3.select('#chart').classed('dimmed', false)
    }

    const filters = {}
    d3.select('#clearFilters').on('click', () => { 
        filters.sex = undefined; 
        filters.company = undefined 
        filters.name = undefined
        redraw()
    })
    const applySexFilter = sex => {
        filters.sex = sex
        redraw()
    }
    d3.select('#maleButton').on('click', () => applySexFilter('M'))
    d3.select('#femaleButton').on('click', () => applySexFilter('F'))
    d3.select('#allButton').on('click', () => applySexFilter(undefined))
    const applyCompanyFilter = company => {
        filters.company = company
        redraw()
    }    
    let debounceTimeout
    d3.select('#companyFilter').on('input', () => {
        cleanData()
        clearTimeout(debounceTimeout)
        setTimeout(() => {
            applyCompanyFilter(d3.select('#companyFilter').node().value)
        }, 1000)        
    })
    const applyNameFilter = name => {
        filters.name = name
        redraw()
    }
    d3.select('#nameFilter').on('input', () => {
        cleanData()
        clearTimeout(debounceTimeout)
        setTimeout(() => {
            applyNameFilter(d3.select('#nameFilter').node().value)
        }, 1000)
    })
    
    const redraw = () => {
        d3.select('#maleButton').classed('active', filters.sex === 'M')
        d3.select('#femaleButton').classed('active', filters.sex === 'F')
        d3.select('#allButton').classed('active', !filters.sex)
        d3.select('#companyFilter').node().value = filters.company || ''
        const company = filters.company ? filters.company.toUpperCase() : undefined
        d3.select('#nameFilter').node().value = filters.name || ''
        const name = filters.name ? filters.name.toLowerCase() : undefined
        const filterCompany = filters.company ? d => {
            if (!d.TEAM_NAME) return false
            const names = aliasMap[d.TEAM_NAME] || [d.TEAM_NAME]
            return names.some(name => name.indexOf && name.indexOf(company, 0) !== -1)
        } : _ => true;
        const filterName = filters.name ? d => {
            return d.DISPLAY_NAME && d.DISPLAY_NAME.indexOf && d.DISPLAY_NAME.toLowerCase().indexOf(name, 0) !== -1
        } : _ => true;
        const filterSex = d => !filters.sex || d.SEX === filters.sex
        filterData(d => filterCompany(d) && filterName(d) && filterSex(d))
        showData(10)
    }

    redraw()
}
run([
    ['WILLIS TOWERS WATSON', 'TOWERS WATSON', 'WATSON WYATT AUSTRALIA', 'WATSON WYATT', 'TILLINGHAST - TOWERS PERRIN', 'TOWERS PERRIN - TILLINGHAST', 'TOWERS PERRIN']
])