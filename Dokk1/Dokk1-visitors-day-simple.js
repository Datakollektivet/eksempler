/*
Copyright (c) 2018, Datakollektivet
All rights reserved.

Redistribution and use in source and binary forms, with or without
modification, are permitted provided that the following conditions are met:
    * Redistributions of source code must retain the above copyright
      notice, this list of conditions and the following disclaimer.
    * Redistributions in binary form must reproduce the above copyright
      notice, this list of conditions and the following disclaimer in the
      documentation and/or other materials provided with the distribution.
    * Neither the name of the <organization> nor the
      names of its contributors may be used to endorse or promote products
      derived from this software without specific prior written permission.

THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND
ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED
WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE
DISCLAIMED. IN NO EVENT SHALL <COPYRIGHT HOLDER> BE LIABLE FOR ANY
DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES
(INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES;
LOSS OF USE, DATA, OR PROFITS; OR BUSINESS INTERRUPTION) HOWEVER CAUSED AND
ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT, STRICT LIABILITY, OR TORT
(INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF THE USE OF THIS
SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.

Author: Henrik Korsgaard

Use:
Include this script as a child within a container element where you want to display
the visualisation. The visualisation adapts to the width of the container element.

<div id="visualisation-container" style="width:1000px;">
        <script src="dokk1-visitor-flow.js"></script>
</div>

This script will call home to http://datakollektivet.dk/dashboard with use statistics on
site context (href), visualisation type, user agent and a time stamp. 

*/
; (function () {

    var _name = "dokk1-flow-simple"
    var _position = window.location.href
    var _container, _shadow, _records, _today, _opens, _closes, _dataOffset;
    var _colors = {
        open: "#e0ecf4",
        in: "#fe9929",
        out: "#fc4e2a",
        visitors: "#01665e",
        guests: "#7a0177"
    }

    document.scripts[document.scripts.length - 1];
    _container = document.scripts[document.scripts.length - 1].parentNode;

    if (!_container) {
        error("Unable to draw visualisation without a container")
    } else if (document.characterSet !== "UTF-8"){
        error("Wrong page encoding. The page you are trying to insert this visualisation on is not encoded with UTF-8, but uses " + document.characterSet + ".")
    } else {
        _shadow = _container.attachShadow({ mode: 'closed' })
        getData()
        loadScripts();
    }

    function done() {
        if (d3 && _records) {
            data = wrangle()
            draw(data)
            addHTML()
        }
    }

    function homing(message) {

    }

    function error(err) {
        //do something more
        var el = document.createElement("div")
        el.innerHTML = err
        console.log(err)
        return
    }

    /**
     * getData() gets the flow counting data from the opendata.dk CKAN datastore.
     * We get the latest records by sorting _id descendingly (sort=_id%20desc).
     * We can not guarantee that the records from the last 24 hours are complete, so 
     * we will get additional data (168 * 5) to adjust for missing data.
     * 
     * This happens asyncroniously, the function calls the global done()
     * function when the data is returned.
     */

    function getData() {
        var u = 'https://portal.opendata.dk/api/3/action/datastore_search?resource_id=5c458799-6926-456f-8629-158f0bf86927&sort=_id%20desc&limit=840'
        var xhr = new XMLHttpRequest();
        xhr.open('GET', u);
        xhr.send(null);

        xhr.addEventListener("load", function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var data = JSON.parse(xhr.response)
                if (data.result.records && data.result.records.length > 0) {
                    _records = data.result.records;
                    done()
                } else {
                    err("Error loading data")
                }
            } else {
                err("Error loading data")
            }
        })

        xhr.addEventListener("error", function (err) {
            error(err)
        })

        xhr.addEventListener("abort", function (err) {
            error(err)
        })
    }

    /** 
     * loadScripts() load the needed D3 scripts into the shadow DOM (_shadow)
     * We do this because we cannot guarantee that the DOM context (HTML page) 
     * the visualisation is generated within have D3 (and the correct version)
     * 
     * As loading happen asyncroniously, the function calls the global done()
     * function when all the scripts are loaded.
    */
    
    function loadScripts() {
        var scripts = ['https://d3js.org/d3.v5.min.js']
        scripts.forEach(function(s){
            var script = document.createElement('script');
            script.type = 'text/javascript';
            script.src = s;

            script.onreadystatechange = script.onload = function(){
                done()
                
                
            }

            _shadow.appendChild(script);
        })
        
    }

    function wrangle() {
        var openingHours = [{ o: 10, c: 16 }, { o: 08, c: 21 }, { o: 08, c: 21 }, { o: 08, c: 21 }, { o: 08, c: 21 }, { o: 08, c: 21 }, { o: 10, c: 16 }]

        for (var i = 0, n = _records.length - 168; i < n; i++) {
            var r = _records[i]
            var rr = _records[i + 167]
            if (new Date(r.time).toDateString() === new Date(rr.time).toDateString()) {
                _records = _records.slice(i, i + 168)
                _dataOffset = i
                break;
            }
        }

        _today = new Date(_records[0].time)
        _opens = openingHours[_today.getDay()].o;
        _closes = openingHours[_today.getDay()].c;

        var hours = []

        for (var i = 0, n = _records.length; i < n; i++) {
            var r = _records[i]
            var h = new Date(r.time).getHours()
            if (!hours[h]) {
                hours[h] = { in: r.in, out: r.out, guests: 0, visitors: r.in - r.out, time: r.time }
            } else {
                hours[h].in += r.in
                hours[h].out += r.out
                hours[h].visitors += r.in - r.out
            }
        }

        for (var i = 1, n = hours.length; i < n; i++) {
            var h = hours[i]
            h.visitors = hours[i - 1].visitors + h.visitors
            if (i >= _opens && i <= _closes) {
                h.guests += hours[i - 1].guests + h.in - h.out
            }
        }

        return { hours: hours, guests: hours.slice(_opens, _closes) }
    }

    function draw(data) {

        var dims = {
            width: _container.getBoundingClientRect().width,
            height: Math.ceil(_container.getBoundingClientRect().width * 0.4),
            marginW: 40,
            marginH: 30
        }

        var x = d3.scaleTime()
            .domain([new Date(data.hours[0].time), new Date(data.hours[23].time).setHours(24)])
            .rangeRound([0, dims.width - 10])

        var yMin = d3.min(data.hours, function (d, i) {
            return Math.min(d.in, d.out, d.visitors, d.guests)
        })

        var yMax = d3.max(data.hours, function (d, i) {
            return Math.max(d.in, d.out, d.visitors, d.guests)
        })

        var y = d3.scaleLinear()
            .domain([Math.floor(yMin / 100) * 100, Math.ceil(yMax / 100) * 100])
            .rangeRound([dims.height - dims.marginH, 0])

        var svg = d3.select(_shadow).append("svg")
            .attr("viewBox", `0 0 ${dims.width + dims.marginW} ${dims.height + dims.marginH}`)
            .append("g")
            .attr("transform", "translate(" + dims.marginW + "," + dims.marginH + ")");

        svg.append("g").attr("class", "hours")
            .append("rect")
            .attr("fill", _colors.open)
            .attr("x", function () {
                var d = new Date(_today)
                d.setHours(_opens)
                return x(d)
            })
            .attr("width", function () {
                var dopen = new Date(_today)
                var dclose = new Date(_today)

                dopen.setHours(_opens)
                dclose.setHours(_closes)
                return x(dclose) - x(dopen)
            })
            .attr("y", 0)
            .attr("height", dims.height - dims.marginH)


        svg.append("g")
            .attr("class", "grid")
            .call(d3.axisLeft(y)
                .tickSize(-dims.width + 10)
                .tickFormat("")
            )

        svg.selectAll("rect.in")
            .data(data.hours)
            .enter().append("rect")
            .attr("class", "in")
            .style("fill", _colors.in)
            .attr("x", function (d) {
                return x(new Date(d.time)) + 4;
            })
            .attr("width", (dims.width - dims.marginW) / 48 - 4)
            .attr("y", function (d) {
                return y(d.in)
            })
            .attr("height", function (d) {
                return y(0) - y(d.in);
            });


        svg.selectAll("rect.out")
            .data(data.hours)
            .enter().append("rect")
            .attr("class", "out")
            .style("fill", _colors.out)
            .attr("x", function (d) {
                return x(new Date(d.time)) + (dims.width - dims.marginW) / 48 + 2;
            })
            .attr("width", (dims.width - dims.marginW) / 48 - 4)
            .attr("y", function (d) {
                return y(d.out)
            })

            .attr("height", function (d) {
                return y(0) - y(d.out);
            });

        var visitorLine = d3.line()
            .curve(d3.curveBasis)
            .x(function (d, i) {
                var offset = (dims.width - dims.marginW) / 48;
                offset = i === data.hours.length - 1 ? (dims.width - dims.marginW) / 24 : offset
                offset = i === 0 ? 0 : offset
                return x(new Date(d.time)) + offset
            })
            .y(function (d) {
                return y(d.visitors)
            })

        svg.append("g").append("path")
            .data([data.hours])
            .attr("fill", "none")
            .attr("stroke-width", 2)
            .attr("stroke", _colors.visitors)
            .attr("stroke-dasharray", "1,6")
            .attr("stroke-linecap", "round")
            .attr("d", visitorLine);

        var guestLine = d3.line()
            .curve(d3.curveBasis)
            .x(function (d, i) {
                var offset = (dims.width - dims.marginW) / 48
                var offset = i === 0 ? 0 : offset;
                var offset = i === data.guests.length - 1 ? (dims.width - dims.marginW) / 24 : offset;
                return x(new Date(d.time)) + offset
            })
            .y(function (d, i) {
                //WARN: we reduce uncertainty by setting negative population to 0
                return d.guests < 0 ? y(0) : y(d.guests)
            })

        svg.append("g").append("path")
            .data([data.guests])
            .attr("fill", "none")
            .attr("stroke-width", 2)
            .attr("stroke", _colors.guests)
            .attr("stroke-linecap", "round")
            .attr("d", guestLine);

        var xAxis = d3.axisBottom(x).ticks(24).tickFormat(d3.timeFormat("%H"));
        var yAxis = d3.axisLeft(y)

        svg.append("g")
            .attr("transform", `translate(0,${dims.height - dims.marginH})`)
            .call(xAxis);

        svg.append("g")
            .attr("transform", `translate(0,0)`)
            .call(yAxis);

        svg.select(".grid").select(".domain").remove()
        svg.select(".grid")
            .selectAll(".tick")
            .select("line")
            .attr("stroke", "#ccc")
            .attr("stroke-dasharray", "2,2");

    }

    function addHTML() {
        var days = ['Søndag', 'Mandag', 'Tirsdag', 'Onsdag', 'Torsdag', 'Fredag', 'Lørdag'];
        var months = ["januar", "februar", "marts", "april", "maj", "juni", "juli", "august", "september", "oktober", "november", "december"];
        var svgWidth = _shadow.querySelector("svg").getBoundingClientRect().width
        var style = document.createElement("style")
        style.innerHTML = `

        :host {
            position:relative;
        }

        #legend {
            position: absolute;
            top: 50px;
            left: 60px;
            padding: 10px;
            background: white;
            border: 1px solid black;
            font-family:verdana;
        }

        #legend div:first-child {
            text-align: center;
            font-size: 70%;
            margin: 5px;
        }

        .legend {
            margin: 2px;
            margin-left: 10px;
            font-size: 80%
        }

        .legend div {
            position: absolute;
            right: 2px;
            margin-top: 2px;
            display: inline-block;
            width: 32px;
            height: 14px;
        }

        .legend div.line {
            margin-top: 2px;
            height: 2px;
        }

        .legend div.line.dashed {
            background:none;
            height:5px;
            border-bottom:2px dashed;
        }

        a {
            display:inline-block;
            color:black;
            font-size: 80%;
            margin:0px 10px;
        }
       
        a:first-child {
            margin-left:40px;
        }

        a:last-child {
            position:absolute;
            left:${svgWidth-130}px;
        }

        a:active,  a:hover,  a:visited {
            text-decoration: none;
        }
        `

        _shadow.appendChild(style)

        var legend =  document.createElement("div")
        legend.id = "legend"
        legend.innerHTML = `Besøgsmønstre på Dokk1
                        <div>${days[_today.getDay()]}, ${_today.getDate()}  ${months[_today.getMonth()]}</div>
                        <div class="legend">Indkommende<div style="background:${_colors.in};"></div></div>
                        <div class="legend">Udgående<div style="background:${_colors.out};"></div></div>
                        <div class="legend">Besøgende hele dagen <div class="line dashed" style="border-color:${_colors.visitors};"></div></div>
                        <div class="legend">Besøgende i åbningstid<div class="line" style="background:${_colors.guests};"></div></div>
                        <div class="legend">Åbningstid<div style="background:${_colors.open};"></div></div>
                        `
        _shadow.appendChild(legend)

        var links = document.createElement("div")
        links.innerHTML = `<a href="https://portal.opendata.dk/dataset/taellekamera-pa-dokk1">Kilde</a>
                    <a href="https://portal.opendata.dk/api/3/action/datastore_search?resource_id=5c458799-6926-456f-8629-158f0bf86927&sort=_id%20desc&limit=168&offset=${_dataOffset}">Data</a>
                    <a href="https://github.com/Datakollektivet/eksempler/blob/master/Dokk1/Dokk1-visitors-day-simple.js">Kode</a>
                    <a>Forbehold</a>
                    <a>Process</a><a href="https://datakollektivet.dk">Datakollektivet.dk 2018</a>`

        _shadow.appendChild(links)
    }

})()

