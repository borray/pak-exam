using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Text.Encodings.Web;
using System.Text.Json;
using Pak.Models;

namespace Pak.Services;

// Хранилище экзаменов — JSON-файл в %AppData%\PAK.
public static class Storage
{
    private static readonly string Dir =
        Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.ApplicationData), "PAK");

    private static readonly string ExamsFile = Path.Combine(Dir, "exams.json");
    private static readonly string LastInstFile = Path.Combine(Dir, "last_institution.txt");

    private static readonly JsonSerializerOptions JsonOpts = new()
    {
        WriteIndented = true,
        Encoder = JavaScriptEncoder.UnsafeRelaxedJsonEscaping,
    };

    private static void EnsureDir()
    {
        if (!Directory.Exists(Dir)) Directory.CreateDirectory(Dir);
    }

    public static List<Exam> LoadExams()
    {
        try
        {
            if (!File.Exists(ExamsFile)) return new List<Exam>();
            return JsonSerializer.Deserialize<List<Exam>>(File.ReadAllText(ExamsFile), JsonOpts)
                   ?? new List<Exam>();
        }
        catch
        {
            return new List<Exam>();
        }
    }

    public static void SaveExams(List<Exam> exams)
    {
        EnsureDir();
        File.WriteAllText(ExamsFile, JsonSerializer.Serialize(exams, JsonOpts));
    }

    public static void SaveExam(Exam exam)
    {
        var exams = LoadExams();
        var idx = exams.FindIndex(e => e.Id == exam.Id);
        if (idx >= 0) exams[idx] = exam; else exams.Add(exam);
        SaveExams(exams);
    }

    public static void DeleteExam(string id)
    {
        var exams = LoadExams();
        exams.RemoveAll(e => e.Id == id);
        SaveExams(exams);
    }

    public static void ExportExam(Exam exam, string path)
        => File.WriteAllText(path, JsonSerializer.Serialize(exam, JsonOpts));

    public static Exam? ImportExam(string path)
    {
        try { return JsonSerializer.Deserialize<Exam>(File.ReadAllText(path), JsonOpts); }
        catch { return null; }
    }

    public static string LastInstitutionCode
    {
        get => File.Exists(LastInstFile) ? File.ReadAllText(LastInstFile).Trim() : "НХД";
        set { EnsureDir(); File.WriteAllText(LastInstFile, value); }
    }
}

public static class Defaults
{
    public static readonly Dictionary<string, string> SubjectAbbr = new()
    {
        ["физика"] = "ФИЗ", ["математика"] = "МАТ", ["русский язык"] = "РУС",
        ["химия"] = "ХИМ", ["биология"] = "БИО", ["история"] = "ИСТ",
        ["география"] = "ГЕО", ["обществознание"] = "ОБЩ", ["английский язык"] = "АНГ",
        ["информатика"] = "ИНФ", ["литература"] = "ЛИТ", ["навигация"] = "НАВ",
    };

    public static string GetSubjectAbbr(string subject)
    {
        var key = subject.ToLower().Trim();
        if (SubjectAbbr.TryGetValue(key, out var abbr)) return abbr;
        var up = subject.Trim().ToUpper();
        return up.Length >= 3 ? up.Substring(0, 3) : up;
    }

    public static int NextVariant(List<Exam> exams, string subject)
    {
        var abbr = GetSubjectAbbr(subject);
        return exams.Count(e => e.SubjectAbbr == abbr) + 1;
    }

    public static string ExamId(int year, string abbr, int variant)
        => $"ПАК-{year}-{abbr}-{variant:D2}";

    public static Exam NewExam(List<Exam> exams)
    {
        var year = DateTime.Now.Year;
        var subject = "Физика";
        var abbr = GetSubjectAbbr(subject);
        var variant = NextVariant(exams, subject);
        return new Exam
        {
            Id = ExamId(year, abbr, variant),
            Subject = subject,
            SubjectAbbr = abbr,
            Variant = variant,
            Year = year,
            InstitutionCode = Storage.LastInstitutionCode,
        };
    }

    public static Question NewQuestion(string type, double defaultPoints)
    {
        var q = new Question { Type = type, Points = defaultPoints };
        switch (type)
        {
            case "single": q.Options = new() { "", "", "", "" }; q.Correct = 0; break;
            case "multi": q.Options = new() { "", "", "", "" }; break;
            case "open": q.Answer = ""; break;
            case "match": q.Pairs = new() { new MatchPair(), new MatchPair() }; break;
            case "fillblank": q.Template = "Заполните пропуск: ___ и ___."; q.Answers = new() { "", "" }; break;
        }
        return q;
    }
}
