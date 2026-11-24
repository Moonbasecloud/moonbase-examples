# Static landing page

A one-page site with a stylesheet and five images. There is no build step and no `package.json`: moonbase serves the files as they are.

```text
static-landing/
  index.html
  styles.css
  images/   hero.svg, mark.svg, beans.svg, cup.svg, pin.svg
```

The page uses relative paths for its stylesheet and images, so it works at any address.

## Deploy with your AI agent

With the moonbase connector connected (see the [repository README](../README.md#before-you-start)), open this repository in your agent and paste:

```text
Deploy the static-landing folder to moonbase and give me the live link.
```

## Run it locally

Any static file server works. With Python installed:

```bash
cd static-landing
python3 -m http.server 8080
```

Then open `http://localhost:8080`.

## Make it yours

Change the text in `index.html`, the colours at the top of `styles.css`, and replace the files in `images/`. Keep `index.html` at the top of the folder: that is how moonbase knows the project is static.

More: [Getting Started](https://moonbase.cloud/docs/getting-started?utm_source=github&utm_medium=moonbase-examples&utm_campaign=gh-launch).
