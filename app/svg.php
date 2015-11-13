<?php
/**
 * Rabobank App
 * (c) Omines Internetbureau B.V.
 *
 * User: Bas Scholts
 * Date: 04/11/2015
 * Time: 07:45
 */

$stroke   = trim($_GET['stroke'], '/');
$fileName = $_GET['file'];

if ($stroke == '')
    $stroke = 'FFFFFF';
$stroke = '#'.$stroke;

if (substr($fileName, -4) != '.svg')
    $fileName .= '.svg';

$file = file_get_contents(__DIR__ . '/img/' . $fileName);
$file = preg_replace('/stroke="#([0-9A-Fa-f]+)"/i', 'stroke="'.$stroke.'"', $file);

header('Content-type: image/svg+xml');
print $file;
