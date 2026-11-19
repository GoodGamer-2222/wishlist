# Birthday Wishlist (GitHub Pages)

A static wishlist with a GitHub-powered admin page.

## Publish it

1. Create a GitHub repository (for example, `birthday-wishlist`).
2. Upload the contents of this folder to the repository's root. Keep `index.html`, `style.css`, `app.js`, `config.js`, `wishlist.json`, `admin/`, and `images/` in these locations.
3. In the repository, open **Settings → Pages**. Under Build and deployment, choose **Deploy from a branch**, select `main` and `/ (root)`, then Save.
4. Wait for GitHub Pages to publish. Your site will be at `https://YOUR-USERNAME.github.io/REPOSITORY/`; admin is at `/admin/`.

## Create the admin token

Create a **fine-grained personal access token** in GitHub settings:
- Resource owner: your account
- Repository access: **Only select repositories**, then choose this wishlist repository
- Repository permissions: **Contents: Read and write**
- No other permissions are needed for this app.
- Choose an expiration that suits you. A token can be revoked from GitHub settings at any time.

Open your site's `/admin/` page, enter your GitHub username, repository name, branch (`main`), and token. Check **Remember my token on this device** if you want the browser to save it locally.

## Important security notes

- GitHub Pages is public hosting. Anyone can view the public wishlist and can also open `/admin/`, but they cannot save changes without a valid token.
- A remembered token is stored in this browser's local storage. Anyone who can use your browser profile may be able to access it. Do not save it on a shared/public computer. Use a token restricted to this one repository, and revoke it if exposed.
- Never paste the token into `config.js`, `app.js`, `index.html`, or any committed file.
- The token is sent from your browser directly to GitHub's API. The app does not send it to a separate server.
- The public page intentionally does not display the private `received` field. It has no buyer reservation, purchase, or "mark as bought" feature. Buyers cannot edit the wishlist.
- Anyone with write access to your GitHub repository can edit the data directly, so keep repository write access private to yourself.

## Product images and links

In admin, upload an image (up to 5 MB) or paste an image URL. Uploaded images are saved under `images/` with generated filenames. Product links open in a new tab.

## Customizing the title

Edit `config.js` in GitHub and change `title`, `birthdayNote`, or `intro`. Save the file; Pages will update after deployment.

## Notes

- This is a static site. GitHub Pages can take a short time to publish each commit.
- If two admin sessions save at nearly the same time, the later GitHub update may conflict. Refresh before retrying.
- Deleting a product does not automatically delete its uploaded image, so unused images may remain in `images/`.
