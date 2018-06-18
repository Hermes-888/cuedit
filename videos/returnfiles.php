<?php
/*
    location /videos/
    returns all filenames of filetype as string
*/
    if(isset($_POST['filetype'])){
        $files = '';
        foreach (glob($_POST['filetype']) as $file) {
          $files .= $file.',';
        }
        echo $files;
    }
