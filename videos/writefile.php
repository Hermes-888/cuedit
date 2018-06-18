<?php
/*
    send webvtt string to write
    & filename
    http://php.net/manual/en/function.file-put-contents.php
*/
if(isset($_POST['filename'])) {
    $file = $_POST['filename'];//'people.vtt';
    // Open the file to get existing content
    $cont = file_get_contents($file);
    // Append a new person to the file
    $current = $_POST['vttdata'];//.= "John Smith\n";
    // Write the contents back to the file
    file_put_contents($file, $current);
    // using the FILE_APPEND flag to append the content to the end of the file
    // and the LOCK_EX flag to prevent anyone else writing to the file at the same time
    //file_put_contents($file, $person, FILE_APPEND | LOCK_EX);

    echo $cont;
}
