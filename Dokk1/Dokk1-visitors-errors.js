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
        <script src="Dokk1-visitor-errors.js"></script>
</div>

This script will call home to http://datakollektivet.dk/dashboard with use statistics on
site context (href), visualisation type, user agent and a time stamp. 

*/

; (function () {

    var _name = "dokk1-flow-simple"
    var _position = window.location.href
    var _container, _shadow, _records;


    document.scripts[document.scripts.length - 1];
    _container = document.scripts[document.scripts.length - 1].parentNode;

    if (!_container) {
        error("Unable to draw visualisation without a container")
    } else if (document.characterSet !== "UTF-8") {
        error("Wrong page encoding. The page you are trying to insert this visualisation on is not encoded with UTF-8, but uses " + document.characterSet + ".")
    } else {
        _shadow = _container.attachShadow({ mode: 'closed' })
        getData()
    }

    function error(err) {
        //do something more
        var el = document.createElement("div")
        el.innerHTML = err
        console.log(err)
        return
    }

    function done() {
        console.log(_records)
        console.log("done")
    }

    /**
     * getData() gets the flow counting data from the opendata.dk CKAN datastore.
     * This happens asyncroniously, the function calls the global done()
     * function when the data is returned.
     */



    function getData() {

        var u = 'https://henrikkorsgaard.dk/data/5c458800-6926-456f-8629-158f0bf86927.json'

        let xhr = new XMLHttpRequest();
        xhr.open('GET', u);
        xhr.send(null);

        xhr.addEventListener("load", function () {
            if (xhr.readyState === 4 && xhr.status === 200) {
                var data = JSON.parse(xhr.response)
                
                _records = data.records
                done()
                
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
})();