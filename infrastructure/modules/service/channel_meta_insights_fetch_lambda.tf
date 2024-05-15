locals {
  image_transformation_zip_filename  = "${path.module}/../environment/lambdas/image-transformation.zip"
  image_transformation_function_name = "${var.environment}-image-transformation"
}

data "aws_iam_policy_document" "lambda_assume_role" {
  statement {
    effect = "Allow"

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }

    actions = ["sts:AssumeRole"]
  }
}

resource "aws_iam_role" "channel_meta_insights_role" {
  name               = "${var.environment}-iam-for-lambda"
  assume_role_policy = data.aws_iam_policy_document.lambda_assume_role.json
}

resource "aws_iam_role_policy_attachment" "channel_meta_insights_logging_policy_attachment" {
  role       = aws_iam_role.channel_meta_insights_role.id
  policy_arn = "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
}

# data "aws_iam_policy_document" "channel_meta_insights_policy_document" {
# }
#
# resource "aws_iam_policy" "channel_meta_insights_policy" {
#   name   = "${var.environment}-channel-meta-insights-policy"
#   policy = data.aws_iam_policy_document.channel_meta_insights_policy_document.json
# }
#
# resource "aws_iam_role_policy_attachment" "channel_meta_insights_policy_attachment" {
#   role       = aws_iam_role.channel_meta_insights_role.name
#   policy_arn = aws_iam_policy.channel_meta_insights_policy.arn
# }

resource "aws_lambda_function" "channel_meta_insights_lambda" {
  architectures = ["arm64"]
  description   = "Ingests meta insights data"
  environment {
    variables = {
    }
  }
  filename      = local.image_transformation_zip_filename
  function_name = local.image_transformation_function_name
  handler       = "index.handler"
  memory_size   = 5000
  role          = aws_iam_role.channel_meta_insights_role.arn
  runtime       = "nodejs18.x"

  # upload the function if the code hash is changed
  source_code_hash = filebase64sha256(local.image_transformation_zip_filename)

  timeout = 300
}
