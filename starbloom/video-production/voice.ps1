$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Speech
$starNarrationRoot = 'E:\videgame\starbloom-video'
$starAudioDir = Join-Path $starNarrationRoot 'audio'
New-Item -ItemType Directory -Path $starAudioDir -Force | Out-Null
$starSpeaker = New-Object System.Speech.Synthesis.SpeechSynthesizer
$starSpeaker.SelectVoice('Microsoft Huihui Desktop')
$starSpeaker.Rate = 1
$starSegments = Get-Content -LiteralPath (Join-Path $starNarrationRoot 'narration.json') -Raw | ConvertFrom-Json
foreach ($starSegment in $starSegments) {
    $starSentenceIndex = 0
    foreach ($starSentence in $starSegment.sentences) {
        $starOutput = Join-Path $starAudioDir ($starSegment.id + '-' + $starSentenceIndex + '.wav')
        $starSpeaker.SetOutputToWaveFile($starOutput)
        $starSpeaker.Speak($starSentence)
        $starSpeaker.SetOutputToNull()
        $starSentenceIndex++
    }
    Write-Output ('Narration ready: ' + $starSegment.id)
}
$starSpeaker.Dispose()
'{"engine":"Windows SAPI","voice":"Microsoft Huihui Desktop","audioPacing":1.13}' | Set-Content -LiteralPath (Join-Path $starNarrationRoot 'voice-engine.json') -Encoding utf8
