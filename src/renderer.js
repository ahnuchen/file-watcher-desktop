// This file is required by the index.html file and will
// be executed in the renderer process for that window.
// All of the Node.js APIs are available in this process.
var { dialog } = require('electron').remote
var chokidar = require('chokidar');
var fs = require('fs-extra')
var path = require('path')



var $sourceDir = $('#sourceDir')
var $targetDir = $('#targetDir')
var $chooseSource = $('#chooseSource')
var $chooseTarget = $('#chooseTarget')
var $start = $('#start')
var $log = $('#log')
var $group1 = $('.input-group').eq(0)
var $group2 = $('.input-group').eq(1)
var $logBox = $('.log-box')
var targetPath
var sourcePath

var storeTargetPath = window.localStorage.getItem('targetPath')
var storeSourcePath = window.localStorage.getItem('sourcePath')
if (storeTargetPath) {
    targetPath = storeTargetPath
    $targetDir.val(storeTargetPath)
}
if (storeSourcePath) {
    sourcePath = storeSourcePath
    $sourceDir.val(storeSourcePath)
}

$chooseSource.click(function () {
    $group1.removeClass('has-error')
    sourcePath = dialog.showOpenDialogSync({
        properties: ['openDirectory']
    })
    if (sourcePath) {
        $sourceDir.val(sourcePath)
        window.localStorage.setItem("sourcePath", sourcePath)
    }
})

$chooseTarget.click(function () {
    $group2.removeClass('has-error')
    targetPath = dialog.showOpenDialogSync({
        properties: ['openDirectory']
    })
    if (targetPath) {
        $targetDir.val(targetPath)
        window.localStorage.setItem("targetPath", targetPath)
    }
})

$start.click(function () {
    var $this = $(this)
    if ($this.hasClass('btn-danger')) {
        return window.location.reload()
    }

    if (!$sourceDir.val()) {
        return $group1.addClass('has-error')
    }
    if (!$targetDir.val()) {
        return $group2.addClass('has-error')
    }
    $this.text('正在运行..')
    $this.addClass('btn-danger')

    // One-liner for current directory, ignores .dotfiles
    chokidar.watch(sourcePath, { ignored: /(^|[\/\\])\../ }).on('all', (event, filePath) => {
        if (event.indexOf('unlink') < 0 && sourcePath !== filePath) {
            copyFiles(filePath)
        }
        if ($log.prop('checked')) {
            outputLog(event, filePath)
        }
    });
})

function copyFiles(filePath) {
    var subFilePath = filePath.replace(sourcePath, '')
    var copyTargetPath = path.join(targetPath, subFilePath)
    console.log(filePath)
    var stat = fs.statSync(filePath)
    if (stat.isFile()) {
        fs.ensureFile(copyTargetPath).then(copy)
    } else {
        fs.ensureDirSync(copyTargetPath)
    }
    function copy() {
        fs.copyFile(path.resolve(filePath), copyTargetPath).catch(function (err) {
            $logBox.append('<p style="color:#f00;">' + err.message + '</p>')
        })
    }
}

function outputLog(event, filePath) {
    var subFilePath = filePath.replace(sourcePath, '')
    $logBox.append('<p><code>' + event + '</code>  ' + subFilePath + '</p>')
    $logBox.scrollTop($logBox.scrollTop()+400)
}