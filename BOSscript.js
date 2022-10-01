async function bw1() {
    var bob1 = localStorage.getItem("bwin1");
    if (bob1 === 'true') {
        localStorage.setItem('bwin1', false);
        $('.buttonbw1').css('background', 'white')
    } else {
        localStorage.setItem('bwin1', true);
        $('.buttonbw1').css('background', 'rgb(0, 149, 255)')}}
async function bw2() {
    var bob2 = localStorage.getItem("bwin2");
    if (bob2 === 'true') {
        localStorage.setItem('bwin2', false);
        $('.buttonbw2').css('background', 'white')
    } else {
        localStorage.setItem('bwin2', true);
        $('.buttonbw2').css('background', 'rgb(0, 149, 255)')}}
async function bw3() {
    var bob3 = localStorage.getItem("bwin3");
    if (bob3 === 'true') {
        localStorage.setItem('bwin3', false);
        $('.buttonbw3').css('background', 'white')
    } else {
        localStorage.setItem('bwin3', true);
        $('.buttonbw3').css('background', 'rgb(0, 149, 255)')}}
async function bw4() {
    var bob4 = localStorage.getItem("bwin4");
    if (bob4 === 'true') {
        localStorage.setItem('bwin4', false);
        $('.buttonbw4').css('background', 'white')
    } else {
        localStorage.setItem('bwin4', true);
        $('.buttonbw4').css('background', 'rgb(0, 149, 255)')}}
async function ow1() {
    var oob1 = localStorage.getItem("owin1");
    if (oob1 === 'true') {
        localStorage.setItem('owin1', false);
        $('.buttonow1').css('background', 'white')
    } else {
        localStorage.setItem('owin1', true);
        $('.buttonow1').css('background', 'rgb(255, 187, 0)')}}
async function ow2() {
    var oob2 = localStorage.getItem("owin2");
    if (oob2 === 'true') {
        localStorage.setItem('owin2', false);
        $('.buttonow2').css('background', 'white')
    } else {
        localStorage.setItem('owin2', true);
        $('.buttonow2').css('background', 'rgb(255, 187, 0)')}}
async function ow3() {
    var oob3 = localStorage.getItem("owin3");
    if (oob3 === 'true') {
        localStorage.setItem('owin3', false);
        $('.buttonow3').css('background', 'white')
    } else {
        localStorage.setItem('owin3', true);
        $('.buttonow3').css('background', 'rgb(255, 187, 0)')}}
async function ow4() {
    var oob4 = localStorage.getItem("owin4");
    if (oob4 === 'true') {
        localStorage.setItem('owin4', false);
        $('.buttonow4').css('background', 'white')
    } else {
        localStorage.setItem('owin4', true);
        $('.buttonow4').css('background', 'rgb(255, 187, 0)')}}
async function bestof3() {
    var bestof3 = localStorage.getItem("bestof3");
    if (bestof3 === 'true') {
        localStorage.removeItem('bestof3');
        localStorage.removeItem('bestof5');
        localStorage.removeItem('bestof7');
        $('.buttonbestof3').css('background', 'white')
    } else {
        localStorage.setItem('bestof3', true);
        localStorage.setItem('bestof5', false);
        localStorage.setItem('bestof7', false);
        $('.buttonbestof3').css('background', 'rgb(0, 255, 145)')
        const classes = ['.buttonnobestof', '.buttonbestof5', '.buttonbestof7']
        for (let i of classes) {
            $(i).css('background', 'white')}}}
async function bestof5() {
    var bestof5 = localStorage.getItem("bestof5");
    if (bestof5 === 'true') {
        localStorage.removeItem('bestof3');
        localStorage.removeItem('bestof5');
        localStorage.removeItem('bestof7');
        $('.buttonbestof5').css('background', 'white')
    } else {
        localStorage.setItem('bestof5', true);
        localStorage.setItem('bestof3', false);
        localStorage.setItem('bestof7', false);
        $('.buttonbestof5').css('background', 'rgb(0, 255, 145)')
        const classes = ['.buttonnobestof', '.buttonbestof3', '.buttonbestof7']
        for (let i of classes) {
            $(i).css('background', 'white')}}}
async function bestof7() {
    var bestof7 = localStorage.getItem("bestof7");
    if (bestof7 === 'true') {
        localStorage.removeItem('bestof3');
        localStorage.removeItem('bestof5');
        localStorage.removeItem('bestof7');
        $('.buttonbestof7').css('background', 'white')
    } else {
        localStorage.setItem('bestof7', true);
        localStorage.setItem('bestof3', false);
        localStorage.setItem('bestof5', false);
        $('.buttonbestof7').css('background', 'rgb(0, 255, 145)')
        const classes = ['.buttonnobestof', '.buttonbestof3', '.buttonbestof5']
        for (let i of classes) {
            $(i).css('background', 'white')}}}
async function nobestof() {
    localStorage.removeItem('bestof3');
    localStorage.removeItem('bestof5');
    localStorage.removeItem('bestof7');
    const classes = ['.buttonnobestof', '.buttonbestof3', '.buttonbestof5', '.buttonbestof7']
    for (let i of classes) {
        $(i).css('background', 'white')}}
async function reset() {
    localStorage.clear();
    const classes = ['.buttonbw1', '.buttonbw2', '.buttonbw3', '.buttonbw4', '.buttonow1', '.buttonow2', '.buttonow3', '.buttonow4', '.buttonow4','.buttonow4', '.buttonnobestof', '.buttonbestof3', '.buttonbestof5', '.buttonbestof7']
    for (let i of classes) {
        $(i).css('background', 'white')}}