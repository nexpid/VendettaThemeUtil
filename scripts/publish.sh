git add colors
node scripts/writecommit.js

msg=`cat scripts/commit.txt`
git commit -m "$msg" | true
git push

rm scripts/commit.txt