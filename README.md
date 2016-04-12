# sigfox-aws
This module should be used to connect a Sigfox modem powered object with AWS.
It uses four AWS modules :
* AWS API Gateway
* AWS Lambda
* AWS IoT
* AWS S3

Full text manual is available (in french), here :
* http://blog.xebia.fr/2016/04/01/atelier-plateforme-1-aws-13/
* http://blog.xebia.fr/2016/04/07/atelier-plateforme-1-aws-23/
* http://blog.xebia.fr/2016/04/12/atelier-plateforme-1-aws-33/

Short english version :
* Git clone, then use npm install to download nodeJs packages. 
* Zip the whole directory, and deploy as Zip package into AWS Lambda.
* Expose an HTTPS Post method using API Gateway. Secure it using API key.
* Modify your Sigfox backend to call HTTPS endpoint, using x-api-header.
* Create your object(s) in AWS IoT module. Download private key and private certificate.
* Put keys and certificates into a S3 bucket, along with a JSON for each of your objects.
* Let the magic happens.
