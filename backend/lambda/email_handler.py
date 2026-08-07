"""
Lambda function: receives a JSON payload {to, subject, body} and sends via SES.

Environment variables (set in the Lambda console):
  FROM_ADDRESS  — verified SES sender address (e.g. noreply@koc830.org)
"""
import json
import os

import boto3

_ses = boto3.client("ses", region_name="us-east-1")
_FROM = os.environ["FROM_ADDRESS"]

_LOGO_URL = "https://d2l5mpo9n81d3v.cloudfront.net/assets/KoCLogo.png"

_HTML_TEMPLATE = """<!doctype html>
<html lang='en'>
<head>
<meta charset='UTF-8'>
<meta name='viewport' content='width=device-width,initial-scale=1,maximum-scale=1,user-scalable=no,shrink-to-fit=yes'>
<title>K of C Council # 830 E-mail</title>
<style type='text/css'>
body {{
font-family: Arial, Helvetica, sans-serif;
font-weight: normal;
color: #003466;
font-size: 14px;
margin-bottom: 14px;
}}
p {{
font-family: Arial, Helvetica, sans-serif;
font-weight: normal;
color: #003466;
font-size: 14px;
margin-bottom: 14px;
}}
</style>
</head>
<body>
<table width='600' align='center' border='1' cellspacing='0' cellpadding='0' bordercolor='#003566' bordercolordark='#003566' bordercolorlight='#003566' style='border-collapse:collapse'>
<tr>
<td height='100' bgcolor='#003566'><table width='600' border='0' cellspacing='0' cellpadding='0'>
<tr>
<td width='355' height='100' align='center'><img src='{logo_url}' width='200' height='72' /></td>
<td width='245' height='100' align='center'>
<strong><font face='Arial' size='2' color='#FFFFFF'>Council #830<br>Denison</font></strong></td>
</tr>
</table></td>
</tr>
<tr>
<td width='600' height='20' bgcolor='#fdbe15' align='center'><a href='https://www.koc830.org'><strong><font color='#003566'>VISIT OUR COUNCIL SITE</font></strong></a></td>
</tr>
<tr>
<td height='250' valign='top' bgcolor='#FFFFFF'><table width='580' border='0' cellspacing='0' cellpadding='0' align='center'>
<tr>
<td height='10'></td>
</tr>
<tr>
<td align='left'><font face='Arial' color='#003566' style='font-size:14px'>THIS EMAIL COURTESY OF DENISON COUNCIL # 830 (www.koc830.org)</font></td>
</tr>
<tr>
<td>&nbsp;</td>
</tr>
<tr>
<td align='left'><font face='Arial' color='#003566' style='font-size:14px'>{message_html}
<p>&nbsp;</p>
<p>Vivat Jesus!</p>
<p>&nbsp;</p></font></td>
</tr>
<tr>
<td height='20'></td>
</tr>
<tr>
<td height='10'></td>
</tr>
<tr>
<td height='20' align='center'><hr size='1' width='100%' noshade /></td>
</tr>
<tr>
<td align='left'><font face='Arial' color='#003566' style='font-size:12px'>You received this message as you are a member of Knights of Columbus Denison Council # 830 in Denison, TX. If you have questions, comments, or concerns please contact the current Grand Knight or Financial Secretary.</font></td>
</tr>
<tr>
<td height='10'></td>
</tr>
</table></td>
</tr>
<tr>
<td width='600' height='20' bgcolor='#fdbe15'></td>
</tr>
<tr>
<td width='600' height='20' bgcolor='#003566'></td>
</tr>
</table>
</body>
</html>"""


def _text_to_html_paragraphs(text: str) -> str:
    """Convert plain text to HTML paragraphs."""
    paragraphs = text.strip().split("\n")
    return "".join(f"<p>{p if p.strip() else '&nbsp;'}</p>" for p in paragraphs)


def _build_html(text: str) -> str:
    """Wrap plain text message in the HTML email template."""
    message_html = _text_to_html_paragraphs(text)
    return _HTML_TEMPLATE.format(logo_url=_LOGO_URL, message_html=message_html)


def lambda_handler(event, context):
    try:
        body = json.loads(event.get("body") or "{}")
    except (ValueError, TypeError):
        return {"statusCode": 400, "body": json.dumps({"error": "invalid JSON"})}

    to = body.get("to")
    subject = body.get("subject", "(no subject)")
    text = body.get("body", "")

    if not to:
        return {"statusCode": 400, "body": json.dumps({"error": "to is required"})}

    recipients = [to] if isinstance(to, str) else list(to)
    html = _build_html(text)

    for address in recipients:
        _ses.send_email(
            Source=_FROM,
            Destination={"ToAddresses": [address]},
            Message={
                "Subject": {"Data": subject},
                "Body": {
                    "Text": {"Data": text},
                    "Html": {"Data": html},
                },
            },
        )

    return {
        "statusCode": 200,
        "headers": {"Content-Type": "application/json"},
        "body": json.dumps({"success": True, "count": len(recipients)}),
    }
