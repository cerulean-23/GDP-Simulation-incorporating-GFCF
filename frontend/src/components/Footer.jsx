import { AUTHOR } from "../data/authorInfo";

export default function Footer() {
  return (
    <footer className="border-t border-slate-800 mt-10">
      <div className="mx-auto max-w-7xl px-4 py-6 text-xs leading-relaxed text-slate-400">
        <p>
          <span className="font-semibold text-slate-400">Disclaimer.</span>{" "}
          This website was developed by {""}
          {AUTHOR.name ? `${AUTHOR.name}, ` : ""}
          a student at {AUTHOR.university} (Student ID: {AUTHOR.studentId}), as
          part of an academic thesis project on nonlinear GDP growth
          simulation.
        </p>
        <p className="mt-2">
        The results are model-based estimates computed from World Bank data and
        data from FRED, Federal Reserve Bank of St. Louis (real GDP and gross
        fixed capital formation), using a Runge-Kutta (RK4) numerical solver with
        Differential Evolution parameter estimation. They are provided for
        academic and research purposes only and must not be used as financial,
        investment, economic, or policy advice. Data availability and accuracy
        depend on the original sources. This website is a student project and is
        not an official product of, or endorsed by, {AUTHOR.university}.
        </p>
      </div>
    </footer>
  );
}