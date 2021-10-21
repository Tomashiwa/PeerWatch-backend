cd ~/cs3219-project-ay2122-2122-s1-g37
rm -rf aws awscliv2.zip
at -M now + 2 minute <<< $'service codedeploy-agent restart'